#!/usr/bin/env node

// Script para probar la API de caja
const https = require('http');
const querystring = require('querystring');

const API_BASE = 'http://localhost:3000';

// Token de prueba - reemplazar con un token válido
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AcG9zLXN5c3RlbS5jb20iLCJyb2wiOiJhZG1pbiIsImlhdCI6MTcxODkyMDQ0MywiZXhwIjoxNzE4OTI0MDQzfQ.xyz123';

const makeRequest = (method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

async function testCajaAPI() {
  console.log('🧪 Probando API de Caja...\n');

  try {
    // 1. Verificar estado actual
    console.log('1. Verificando estado actual de caja...');
    const estadoActual = await makeRequest('GET', '/caja/actual');
    console.log('   Status:', estadoActual.status);
    console.log('   Response:', JSON.stringify(estadoActual.data, null, 2));
    console.log('');

    // 2. Si no hay caja abierta, intentar abrir una
    if (estadoActual.status === 404 || !estadoActual.data) {
      console.log('2. No hay caja abierta. Intentando abrir caja...');
      const abrirCaja = await makeRequest('POST', '/caja/abrir', {
        saldoInicial: 100.00,
        cajaId: 1,
        observaciones: 'Test de apertura automática'
      });
      console.log('   Status:', abrirCaja.status);
      console.log('   Response:', JSON.stringify(abrirCaja.data, null, 2));
      console.log('');
    } else {
      console.log('2. Ya hay una caja abierta. Saltando apertura.\n');
    }

    // 3. Probar movimiento de efectivo (entrada)
    console.log('3. Registrando entrada de efectivo...');
    const entradaEfectivo = await makeRequest('POST', '/cash-movement', {
      usuarioId: 1,
      tipo: 'IN',
      monto: 50.00,
      descripcion: 'Test de entrada - fondos adicionales'
    });
    console.log('   Status:', entradaEfectivo.status);
    console.log('   Response:', JSON.stringify(entradaEfectivo.data, null, 2));
    console.log('');

    // 4. Probar movimiento de efectivo (salida)
    console.log('4. Registrando salida de efectivo...');
    const salidaEfectivo = await makeRequest('POST', '/cash-movement', {
      usuarioId: 1,
      tipo: 'OUT',
      monto: 25.00,
      descripcion: 'Test de salida - gastos operativos'
    });
    console.log('   Status:', salidaEfectivo.status);
    console.log('   Response:', JSON.stringify(salidaEfectivo.data, null, 2));
    console.log('');

    // 5. Listar movimientos de efectivo
    console.log('5. Listando movimientos de efectivo...');
    const movimientos = await makeRequest('GET', '/cash-movement');
    console.log('   Status:', movimientos.status);
    console.log('   Response:', JSON.stringify(movimientos.data, null, 2));
    console.log('');

    console.log('✅ Prueba de API de Caja completada');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

testCajaAPI();