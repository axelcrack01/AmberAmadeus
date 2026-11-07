"""Evidencia pendiente: ejecutar con selenium y Chrome local. NO ejecutado en esta entrega.
Requisitos: pip install selenium; exportar AMBER_URL (localhost:3000 o preview Vercel).
"""
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

url=os.environ.get('AMBER_URL','http://localhost:3000').rstrip('/')
with webdriver.Chrome() as driver:
    driver.get(url+'/index.html')
    wait=WebDriverWait(driver,15)
    wait.until(EC.presence_of_element_located((By.ID,'correo'))).send_keys('admin@demo.local')
    driver.find_element(By.ID,'clave').send_keys('Demo2026!')
    driver.find_element(By.ID,'btnIngresar').click()
    wait.until(EC.url_contains('panel.html'))
    assert driver.find_element(By.CSS_SELECTOR,'main').is_displayed()
    driver.save_screenshot('evidencia_login_panel.png')
    driver.get(url+'/ventas.html')
    wait.until(EC.presence_of_element_located((By.ID,'buscarVenta')))
    driver.save_screenshot('evidencia_formulario_ventas.png')
    driver.get(url+'/caja.html')
    wait.until(EC.presence_of_element_located((By.ID,'estadoCaja')))
    driver.save_screenshot('evidencia_caja.png')
    print('Selenium: navegación y vistas validadas. No se registraron ventas en este script.')
