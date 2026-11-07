from __future__ import annotations

import csv
import hashlib
import json
import os
import re
import sys
import time
import traceback
import unicodedata
import zipfile
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlparse

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

URL = os.environ.get('AMBER_URL', 'https://amber-amadeus-web.vercel.app').rstrip('/')
USER = os.environ.get('AMBER_USUARIO', 'admin@demo.local')
PASS = os.environ.get('AMBER_CLAVE', 'Demo2026!')  # Solo cuenta ficticia; nunca exportar la clave.
PAUSA = float(os.environ.get('AMBER_PAUSA_SEGUNDOS', '3'))
if PAUSA < 0:
    raise ValueError('AMBER_PAUSA_SEGUNDOS no puede ser negativo.')
ROOT = Path(os.environ.get('AMBER_EVIDENCIAS', 'evidencias_selenium_edge')).resolve()
RUN = ROOT / datetime.now().strftime('%Y%m%d_%H%M%S_%f')
CAPTURAS = RUN / 'capturas_originales'
CAPTURAS.mkdir(parents=True, exist_ok=False)

steps: list[dict] = []
results: list[dict] = []
console: list[str] = []
info = {
    'proyecto': 'Amber Amadeus Café', 'practicas': 'PC08 y PC10',
    'url_prueba': URL, 'usuario_prueba': USER,
    'inicio_local': datetime.now().astimezone().isoformat(timespec='seconds'),
    'pausa_segundos_por_accion': PAUSA,
    'estado_general': 'EN EJECUCION', 'venta_id': None,
    'entorno': 'POR DETERMINAR', 'navegador': 'Microsoft Edge',
}
driver = None
current_case = 'INICIO'


def stamp() -> str:
    return datetime.now().astimezone().isoformat(timespec='seconds')


def log(message: str) -> None:
    line = f'{stamp()} | {message}'
    console.append(line)
    print(line, flush=True)


def slug(value: str) -> str:
    clean = unicodedata.normalize('NFKD', value)
    clean = ''.join(c for c in clean if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', '_', clean.lower()).strip('_')[:52] or 'paso'


def capture(case: str, title: str, *, state: str = 'EVIDENCIA') -> str:
    """Captura PNG binario sin retoque; no recorta, no optimiza, no modifica."""
    if driver is None:
        return ''
    n = len(steps) + 1
    name = f'{n:02d}_{slug(case)}_{slug(title)}.png'
    file = CAPTURAS / name
    if not driver.save_screenshot(str(file)):
        raise RuntimeError('WebDriver no pudo guardar una captura PNG.')
    digest = hashlib.sha256(file.read_bytes()).hexdigest()
    steps.append({
        'paso': n, 'caso': case, 'descripcion': title, 'estado': state,
        'fecha_hora': stamp(), 'url': driver.current_url,
        'archivo': str(Path('capturas_originales') / name),
        'sha256': digest,
    })
    log(f'CAPTURA {n:02d} | {case} | {title} | {name}')
    return name


def after_action(case: str, title: str) -> None:
    time.sleep(PAUSA)
    capture(case, title)


def action(case: str, title: str, callback) -> None:
    """Una acción de usuario y su evidencia con pausa fija."""
    global current_case
    current_case = case
    log(f'ACCION | {case} | {title}')
    callback()
    after_action(case, title)


def navigate(case: str, path: str, label: str, wait_selector: str) -> None:
    action(case, label, lambda: (driver.get(URL + path), WebDriverWait(driver, 25).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, wait_selector)))))


def fill(case: str, selector: str, value: str, label: str) -> None:
    def operate():
        field = WebDriverWait(driver, 25).until(EC.element_to_be_clickable((By.CSS_SELECTOR, selector)))
        field.clear()
        field.send_keys(value)
    action(case, label, operate)


def click(case: str, selector: str, label: str, *, wait_until=None) -> None:
    def operate():
        WebDriverWait(driver, 25).until(EC.element_to_be_clickable((By.CSS_SELECTOR, selector))).click()
        if wait_until is not None:
            WebDriverWait(driver, 25).until(wait_until)
    action(case, label, operate)


def choose(case: str, selector: str, option: str, label: str) -> None:
    def operate():
        Select(WebDriverWait(driver, 25).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, selector)))).select_by_value(option)
    action(case, label, operate)


def verify(case: str, title: str, detail: str) -> None:
    """Solo declara APROBADO después de que las verificaciones ya sucedieron."""
    global current_case
    current_case = case
    after_action(case, 'Verificacion - ' + title)
    results.append({
        'caso': case, 'fecha_hora': stamp(), 'estado': 'APROBADO',
        'resultado_obtenido': detail,
        'evidencia': steps[-1]['archivo'] if steps else '',
        'incidencia': '', 're_prueba': '',
    })
    log(f'[{case}] APROBADO | {title} | {detail}')


def skip(case: str, title: str, detail: str) -> None:
    results.append({
        'caso': case, 'fecha_hora': stamp(), 'estado': 'NO APLICA',
        'resultado_obtenido': detail, 'evidencia': '',
        'incidencia': '', 're_prueba': '',
    })
    log(f'[{case}] NO APLICA | {title} | {detail}')


def parse_soles(value: str) -> Decimal:
    match = re.search(r'S/\s*([\d.,]+)', value)
    if not match:
        raise AssertionError(f'No se reconoce un monto en: {value!r}')
    return Decimal(match.group(1).replace(',', ''))


def save_results() -> None:
    info['fin_local'] = stamp()
    info['capturas_originales'] = len(steps)
    (RUN / 'metadatos_entorno.json').write_text(
        json.dumps(info, indent=2, ensure_ascii=False), encoding='utf-8')
    with (RUN / 'matriz_resultados_para_copiar.csv').open('w', newline='', encoding='utf-8-sig') as file:
        fields = ['caso','fecha_hora','estado','resultado_obtenido','evidencia','incidencia','re_prueba']
        writer = csv.DictWriter(file, fieldnames=fields, delimiter=';')
        writer.writeheader()
        writer.writerows(results)
    with (RUN / 'manifest_capturas_sha256.csv').open('w', newline='', encoding='utf-8-sig') as file:
        fields = ['paso','caso','descripcion','estado','fecha_hora','url','archivo','sha256']
        writer = csv.DictWriter(file, fieldnames=fields, delimiter=';')
        writer.writeheader()
        writer.writerows(steps)
    (RUN / 'salida_programa.txt').write_text(
        '\n'.join(console) + f"\nESTADO GENERAL: {info['estado_general']}\n", encoding='utf-8')


def create_word() -> Path:
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.shared import Cm, Inches, Pt, RGBColor

    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(29.7), Cm(21.0)  # A4 horizontal: capturas legibles
    sec.left_margin = sec.right_margin = Cm(1.8)
    sec.top_margin = Cm(1.65)
    sec.bottom_margin = Cm(1.45)
    sec.header_distance = sec.footer_distance = Cm(.7)

    normal = doc.styles['Normal']
    normal.font.name = 'Times New Roman'
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor(0, 0, 0)
    normal.paragraph_format.space_after = Pt(5)
    for sty in ['Title', 'Heading 1', 'Heading 2']:
        doc.styles[sty].font.name = 'Times New Roman'
        doc.styles[sty].font.color.rgb = RGBColor(0, 0, 0)
    header = sec.header.paragraphs[0]
    header.text = 'AMBER AMADEUS CAFÉ  |  REGISTRO DE EVIDENCIAS  |  PC08–PC10'
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    for run in header.runs:
        run.font.name = 'Times New Roman'
        run.font.size = Pt(8)
    foot = sec.footer.paragraphs[0]
    foot.text = 'Capturas obtenidas por Selenium con Microsoft Edge; conservar también los PNG originales.'
    foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in foot.runs:
        run.font.size = Pt(8)

    title = doc.add_paragraph()
    title.paragraph_format.space_after = Pt(12)
    title_run = title.add_run('Evidencias de ejecución de pruebas')
    title_run.bold = True
    title_run.font.size = Pt(18)
    title_run.font.color.rgb = RGBColor(0, 0, 0)
    doc.add_paragraph('Amber Amadeus Café | Prácticas de campo 8 y 10')
    t = doc.add_table(rows=0, cols=2)
    t.style = 'Table Grid'
    for k, v in [
        ('Fecha y hora de inicio', info.get('inicio_local', '')),
        ('Fecha y hora de fin', info.get('fin_local', '')),
        ('Entorno', info.get('entorno', 'Sin determinar')),
        ('URL inicial', info.get('url_prueba', '')),
        ('Navegador', info.get('navegador', 'Microsoft Edge')),
        ('Versión de Edge', info.get('version_navegador', 'No detectada')),
        ('Versión de Selenium', info.get('selenium', 'No detectada')),
        ('Usuario de prueba', info.get('usuario_prueba', '')),
        ('Pausa entre acciones', f'{PAUSA:g} segundos'),
        ('ID de venta de prueba', str(info.get('venta_id') or 'No disponible')),
        ('Resultado general', info.get('estado_general', '')),
        ('Número de capturas', str(len(steps))),
    ]:
        row = t.add_row()
        row.cells[0].text, row.cells[1].text = str(k), str(v)
    doc.add_paragraph('Las imágenes proceden de WebDriver.save_screenshot y se almacenan como archivos PNG originales. '
                      'Las páginas siguientes reproducen esas capturas sin editar. El archivo manifest_capturas_sha256.csv '
                      'permite verificar su integridad.')
    if info.get('incidencia'):
        doc.add_paragraph('Incidencia: ' + str(info['incidencia']))

    doc.add_heading('Resultados registrados', level=1)
    if results:
        rt = doc.add_table(rows=1, cols=3)
        rt.style = 'Table Grid'
        rt.rows[0].cells[0].text = 'Caso'
        rt.rows[0].cells[1].text = 'Estado'
        rt.rows[0].cells[2].text = 'Resultado observado'
        for item in results:
            cells = rt.add_row().cells
            cells[0].text = item['caso']
            cells[1].text = item['estado']
            cells[2].text = item['resultado_obtenido']
    else:
        doc.add_paragraph('No se ejecutaron casos de prueba; revisar la incidencia registrada.')

    doc.add_heading('Capturas originales por acción', level=1)
    if not steps:
        doc.add_paragraph('No se generaron capturas: la ejecución se detuvo antes de abrir el navegador.')
    for item in steps:
        doc.add_page_break()
        heading = doc.add_heading(f"Paso {item['paso']:02d} · {item['descripcion']}", level=2)
        heading.paragraph_format.space_after = Pt(4)
        line = doc.add_paragraph(f"Caso: {item['caso']}  |  Fecha: {item['fecha_hora']}  |  Estado: {item['estado']}")
        line.paragraph_format.space_after = Pt(3)
        line2 = doc.add_paragraph('URL: ' + item['url'])
        line2.paragraph_format.space_after = Pt(8)
        path = RUN / item['archivo']
        if path.is_file():
            paragraph = doc.add_paragraph()
            paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
            paragraph.add_run().add_picture(str(path), width=Inches(8.5))
            caption = doc.add_paragraph(item['archivo'] + ' | SHA-256: ' + item['sha256'])
            caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in caption.runs:
                run.font.size = Pt(7)
        else:
            doc.add_paragraph('Imagen no encontrada. Se conserva la incidencia en el registro.')
    destination = RUN / 'Evidencias_Selenium_PC08_PC10_Edge.docx'
    doc.save(destination)
    return destination


def finish() -> None:
    save_results()
    try:
        path = create_word()
        log(f'WORD GENERADO | {path}')
    except Exception as error:
        (RUN / 'ERROR_GENERAR_WORD.txt').write_text(traceback.format_exc(), encoding='utf-8')
        log(f'NO SE PUDO GENERAR WORD: {error} | Instalar python-docx: py -m pip install python-docx')
    (RUN / 'salida_programa.txt').write_text(
        '\n'.join(console) + f"\nESTADO GENERAL: {info['estado_general']}\n", encoding='utf-8')
    zip_path = RUN / 'Paquete_evidencias_originales.zip'
    with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for path in sorted(RUN.rglob('*')):
            if path.is_file() and path != zip_path:
                archive.write(path, path.relative_to(RUN))
    log('PAQUETE DE EVIDENCIAS | ' + str(zip_path))


def run() -> None:
    global driver, current_case
    parsed = urlparse(URL)
    if parsed.scheme not in ('http', 'https') or not parsed.hostname:
        raise ValueError('AMBER_URL requiere una URL http/https válida.')
    log('La ejecución registra datos ficticios. Usar solo la demo de Vercel o la BD académica local.')
    opts = webdriver.EdgeOptions()
    opts.add_argument('--window-size=1440,1000')
    opts.add_argument('--inprivate')  # Aísla los datos locales de prueba en Vercel.
    driver = webdriver.Edge(options=opts)
    driver.set_window_size(1440, 1000)
    wait = WebDriverWait(driver, 25)
    info['version_navegador'] = driver.capabilities.get('browserVersion', 'No reportada')
    info['selenium'] = __import__('selenium').__version__
    info['plataforma'] = driver.capabilities.get('platformName', sys.platform)
    log('NAVEGADOR | Microsoft Edge | versión ' + info['version_navegador'])

    current_case = 'PC08-01'
    navigate(current_case, '/index.html', 'Abrir pantalla de inicio de sesión', '#correo')
    fill(current_case, '#correo', USER, 'Ingresar correo del administrador')
    fill(current_case, '#clave', PASS, 'Ingresar contraseña (oculta en pantalla)')
    click(current_case, '#btnIngresar', 'Acceder al panel general',
          wait_until=EC.url_contains('panel.html'))
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, 'main')))
    verify(current_case, 'Inicio de sesión', 'Acceso al panel con la cuenta de prueba.')

    mode = driver.find_element(By.CSS_SELECTOR, '[data-modo]').text.strip()
    info['entorno'] = 'PostgreSQL local' if 'PostgreSQL' in mode else 'Demostración con datos en navegador'
    log('ENTORNO | ' + info['entorno'])
    if 'PostgreSQL' in mode and parsed.hostname not in ('localhost', '127.0.0.1'):
        raise RuntimeError('Backend PostgreSQL externo detectado: prueba de ventas cancelada por seguridad.')

    current_case = 'PC08-02'
    navigate(current_case, '/caja.html', 'Abrir Control de caja', '#estadoCaja')
    wait.until(lambda d: 'Consultando' not in d.find_element(By.ID, 'estadoCaja').text)
    state = driver.find_element(By.ID, 'estadoCaja').text
    opened_here = 'No tienes una caja abierta' in state
    if opened_here:
        fill(current_case, '#fondoInicial', '100.00', 'Registrar fondo inicial de S/ 100.00')
        click(current_case, '#formAbrirCaja button[type="submit"]', 'Confirmar apertura de caja',
              wait_until=lambda d: 'Abierta' in d.find_element(By.ID, 'estadoCaja').text)
    if 'Abierta' not in driver.find_element(By.ID, 'estadoCaja').text:
        raise AssertionError('No se confirmó una caja abierta.')
    info['caja_abierta_en_esta_prueba'] = opened_here
    verify(current_case, 'Apertura de caja', f'Caja activa; apertura creada por el script: {opened_here}.')

    current_case = 'PC08-03'
    navigate(current_case, '/ventas.html', 'Abrir formulario de venta', '[data-agregar]')
    click(current_case, '[data-agregar]', 'Agregar un producto al carrito')
    total = parse_soles(driver.find_element(By.ID, 'totalCarrito').text)
    if total <= 0:
        raise AssertionError('El total registrado es cero o negativo.')
    verify(current_case, 'Producto y total', f'Carrito con un producto; total S/ {total:.2f}.')

    current_case = 'PC08-04'
    choose(current_case, '#medioPago', 'EFECTIVO', 'Seleccionar medio de pago en efectivo')
    received = total + Decimal('10.00')
    fill(current_case, '#importeRecibido', f'{received:.2f}',
         f'Ingresar efectivo recibido S/ {received:.2f}')
    wait.until(lambda d: 'Vuelto a entregar' in d.find_element(By.ID, 'mensajeCambio').text)
    change = parse_soles(driver.find_element(By.ID, 'mensajeCambio').text)
    if change != Decimal('10.00'):
        raise AssertionError(f'Vuelto distinto a S/ 10.00: S/ {change:.2f}')
    info.update({'total_venta_soles': str(total), 'efectivo_recibido_soles': str(received),
                 'vuelto_soles': str(change)})
    verify(current_case, 'Cálculo de vuelto', f'Entregado S/ {received:.2f}; vuelto S/ {change:.2f}.')

    current_case = 'PC08-05'
    click(current_case, '#confirmarVenta', 'Registrar venta y mostrar ticket',
          wait_until=lambda d: d.find_element(By.ID, 'modalRecibo').get_attribute('open') is not None)
    receipt = driver.find_element(By.ID, 'reciboContenido').text
    match = re.search(r'V-(\d+)', receipt)
    if not match:
        raise AssertionError('El recibo interno no presenta un identificador V-...')
    sale_id = int(match.group(1))
    info['venta_id'] = sale_id
    if f'S/ {total:.2f}' not in receipt and parse_soles(receipt) <= 0:
        raise AssertionError('El ticket no muestra un importe válido.')
    verify(current_case, 'Ticket interno', f'Venta V-{sale_id:04d}; total S/ {total:.2f}.')

    current_case = 'PC08-06'
    navigate(current_case, '/historial.html', 'Abrir historial de ventas', '#buscarHistorial')
    fill(current_case, '#buscarHistorial', f'V-{sale_id:04d}', 'Buscar venta por número')
    wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, '#tablaVentas [data-ver]')) >= 1)
    row = driver.find_element(By.CSS_SELECTOR, '#tablaVentas tr').text
    if f'V-{sale_id:04d}' not in row:
        raise AssertionError('No se encontró la venta registrada en el historial.')
    verify(current_case, 'Búsqueda en historial', f'Venta V-{sale_id:04d} localizada.')

    current_case = 'PC10-01'
    click(current_case, '#tablaVentas [data-ver]', 'Abrir detalle del historial',
          wait_until=lambda d: d.find_element(By.ID, 'modalRecibo').get_attribute('open') is not None)
    if f'V-{sale_id:04d}' not in driver.find_element(By.ID, 'reciboContenido').text:
        raise AssertionError('El detalle de la transacción no coincide con el identificador buscado.')
    verify(current_case, 'Detalle de venta', f'Contenido del detalle V-{sale_id:04d} verificado.')

    current_case = 'PC10-02'
    navigate(current_case, '/resumen.html', 'Abrir reportes de ventas', '#totalResumen')
    wait.until(lambda d: d.find_element(By.ID, 'cantidadResumen').text.strip() not in ('', 'Cargando...'))
    verify(current_case, 'Indicadores comerciales', 'Resumen del periodo consultado y visible.')

    current_case = 'PC10-03'
    if opened_here:
        navigate(current_case, '/caja.html', 'Abrir caja para cierre', '#estadoCaja')
        wait.until(lambda d: 'Abierta' in d.find_element(By.ID, 'estadoCaja').text)
        expected = parse_soles(driver.find_element(By.ID, 'efectivoEsperadoCaja').text)
        fill(current_case, '#efectivoContado', f'{expected:.2f}',
             f'Introducir efectivo contado S/ {expected:.2f}')

        # Click produce un confirm() JS: aceptar antes de intentar capturar la página.
        def approve_close():
            driver.find_element(By.CSS_SELECTOR, '#formCerrarCaja button[type="submit"]').click()
            alert = WebDriverWait(driver, 8).until(EC.alert_is_present())
            alert.accept()
            wait.until(lambda d: 'No tienes una caja abierta' in d.find_element(By.ID, 'estadoCaja').text)
        action(current_case, 'Confirmar diálogo y registrar cierre de caja', approve_close)
        verify(current_case, 'Cierre de caja', f'Efectivo contado S/ {expected:.2f}.')
    else:
        skip(current_case, 'Cierre de caja',
             'Ya existía una caja abierta antes de la ejecución; no se altera ese turno.')


def main() -> int:
    global driver, current_case
    try:
        run()
        info['estado_general'] = 'APROBADO (solo verificaciones realizadas por Selenium)'
    except Exception as exc:
        detail = f'{type(exc).__name__}: {exc}'
        log(f'ERROR | {current_case} | {detail}')
        info['estado_general'] = 'FALLIDO'
        info['incidencia'] = detail
        image = ''
        if driver is not None:
            try:
                time.sleep(PAUSA)
                image = capture(current_case, 'Error durante la ejecución', state='FALLIDO')
            except Exception as shot_error:
                log(f'No se pudo capturar el error: {shot_error}')
        results.append({
            'caso': current_case, 'fecha_hora': stamp(), 'estado': 'FALLIDO',
            'resultado_obtenido': detail,
            'evidencia': str(Path('capturas_originales') / image) if image else '',
            'incidencia': detail, 're_prueba': 'PENDIENTE',
        })
        (RUN / 'error_detallado.txt').write_text(traceback.format_exc(), encoding='utf-8')
    finally:
        if driver is not None:
            try:
                driver.quit()
            except Exception as close_error:
                log('No se pudo cerrar Edge: ' + str(close_error))
        finish()
    log(f"FIN | {info['estado_general']} | Resultado en {RUN}")
    return 1 if info['estado_general'] == 'FALLIDO' else 0


if __name__ == '__main__':
    sys.exit(main())
