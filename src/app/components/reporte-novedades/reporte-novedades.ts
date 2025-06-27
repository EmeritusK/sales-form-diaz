import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interfaces
interface Entrada {
  id: number;
  factura: string;
  cliente: string;
  producto: string;
  cantidad: number;
  precioFacturado: number;
  precioOfrecido: number;
  diferencia: number;
  totalDescuento: number;
}

interface Reporte {
  vendedor: string;
  fecha: string;
  observaciones: string;
  entradas: Entrada[];
  resumen: {
    totalEntradas: number;
    totalDescuentos: number;
    promedioDescuento: number;
  };
  fechaEnvio: string;
}

@Component({
  selector: 'app-reporte-novedades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-novedades.html',
  styleUrl: './reporte-novedades.css'
})
export class ReporteNovedadesComponent implements OnInit {
  // Propiedades del formulario
  vendedor: string = '';
  fecha: string = '';
  factura: string = '';
  cliente: string = '';
  precioFacturado: number = 0;
  precioOfrecido: number = 0;
  diferencia: number = 0;
  cantidad: number = 0;
  producto: string = '';
  totalDescuento: number = 0;
  observaciones: string = '';

  // Propiedades del componente
  entradas: Entrada[] = [];
  entryCounter: number = 0;
  mostrarResumen: boolean = false;
  toastMensaje: string = '';
  toastTipo: string = 'success';
  mostrarToast: boolean = false;

  // Configuración de email (CAMBIAR ESTE VALOR)
  emailDestino: string = 'jairparedesal123@gmail.com';

  ngOnInit(): void {
    // Configurar fecha actual por defecto
    this.fecha = new Date().toISOString().split('T')[0];
  }

  // Métodos de cálculo
  calcularDiferencia(): void {
    this.diferencia = this.precioFacturado - this.precioOfrecido;
    this.calcularDescuento();
  }

  calcularDescuento(): void {
    this.totalDescuento = this.diferencia * this.cantidad;
  }

  // Métodos de gestión de entradas
  agregarEntrada(): void {
    if (!this.cliente || !this.producto || !this.cantidad || !this.precioFacturado || !this.precioOfrecido) {
      this.mostrarMensajeToast('⚠️ Complete todos los campos antes de agregar la entrada', 'warning');
      return;
    }

    const entrada: Entrada = {
      id: ++this.entryCounter,
      factura: this.factura,
      cliente: this.cliente,
      producto: this.producto,
      cantidad: this.cantidad,
      precioFacturado: this.precioFacturado,
      precioOfrecido: this.precioOfrecido,
      diferencia: this.diferencia,
      totalDescuento: this.totalDescuento
    };

    this.entradas.push(entrada);
    this.limpiarCamposEntrada();
    this.actualizarResumen();
    this.mostrarMensajeToast('✅ Entrada agregada correctamente', 'success');
  }

  eliminarEntrada(id: number): void {
    this.entradas = this.entradas.filter(entrada => entrada.id !== id);
    this.actualizarResumen();
    this.mostrarMensajeToast('🗑️ Entrada eliminada', 'info');
  }

  limpiarCamposEntrada(): void {
    this.factura = '';
    this.cliente = '';
    this.producto = '';
    this.cantidad = 0;
    this.precioFacturado = 0;
    this.precioOfrecido = 0;
    this.diferencia = 0;
    this.totalDescuento = 0;
  }

  // Métodos de resumen
  actualizarResumen(): void {
    this.mostrarResumen = this.entradas.length > 0;
  }

  getTotalDescuentos(): number {
    return this.entradas.reduce((sum, entrada) => sum + entrada.totalDescuento, 0);
  }

  getPromedioDescuento(): number {
    if (this.entradas.length === 0) return 0;
    return this.getTotalDescuentos() / this.entradas.length;
  }

  // Métodos de utilidad
  limpiarFormulario(): void {
    if (confirm('¿Está seguro de que desea limpiar todo el formulario?')) {
      this.vendedor = '';
      this.fecha = new Date().toISOString().split('T')[0];
      this.observaciones = '';
      this.entradas = [];
      this.entryCounter = 0;
      this.limpiarCamposEntrada();
      this.actualizarResumen();
      this.mostrarMensajeToast('🔄 Formulario limpiado', 'info');
    }
  }

  mostrarMensajeToast(mensaje: string, tipo: string = 'success'): void {
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    this.mostrarToast = true;

    setTimeout(() => {
      this.mostrarToast = false;
    }, 3000);
  }

  // Métodos de envío
  enviarReporte(): void {
    if (this.entradas.length === 0) {
      this.mostrarMensajeToast('⚠️ Debe agregar al menos una entrada antes de enviar', 'warning');
      return;
    }

    const reporte: Reporte = {
      vendedor: this.vendedor,
      fecha: this.fecha,
      observaciones: this.observaciones,
      entradas: this.entradas,
      resumen: {
        totalEntradas: this.entradas.length,
        totalDescuentos: this.getTotalDescuentos(),
        promedioDescuento: this.getPromedioDescuento()
      },
      fechaEnvio: new Date().toISOString()
    };

    // Generar CSV para descarga
    this.generarCSV(reporte);

    // Generar email con los datos
    this.generarEmail(reporte);

    this.mostrarMensajeToast('🎉 Reporte generado correctamente. Descarga el archivo CSV y envía el email.', 'success');
  }

  generarCSV(reporte: Reporte): void {
    let csv = 'Vendedor,Fecha,Factura,Cliente,Producto,Cantidad,Precio Facturado,Precio Ofrecido,Diferencia,Total Descuento\n';

    reporte.entradas.forEach(entrada => {
      csv += `${reporte.vendedor},${reporte.fecha},${entrada.factura},"${entrada.cliente}","${entrada.producto}",${entrada.cantidad},${entrada.precioFacturado},${entrada.precioOfrecido},${entrada.diferencia},${entrada.totalDescuento}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `reporte_${reporte.vendedor}_${reporte.fecha}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  generarEmail(reporte: Reporte): void {
    const subject = `Reporte de Ventas - ${reporte.vendedor} - ${reporte.fecha}`;

    let body = `Hola,\n\n`;
    body += `Adjunto el reporte de ventas de ${reporte.vendedor} correspondiente al ${reporte.fecha}.\n\n`;
    body += `RESUMEN:\n`;
    body += `- Total de entradas: ${reporte.resumen.totalEntradas}\n`;
    body += `- Total descuentos: $${reporte.resumen.totalDescuentos.toFixed(2)}\n`;
    body += `- Promedio por entrada: $${reporte.resumen.promedioDescuento.toFixed(2)}\n\n`;

    body += `DETALLE DE ENTRADAS:\n`;
    reporte.entradas.forEach((entrada, index) => {
      body += `${index + 1}. ${entrada.cliente} - ${entrada.producto}\n`;
      body += `   Factura: ${entrada.factura} | Cantidad: ${entrada.cantidad}\n`;
      body += `   Precio Facturado: $${entrada.precioFacturado.toFixed(2)} | Precio Ofrecido: $${entrada.precioOfrecido.toFixed(2)}\n`;
      body += `   Descuento Total: $${entrada.totalDescuento.toFixed(2)}\n\n`;
    });

    if (reporte.observaciones) {
      body += `OBSERVACIONES:\n${reporte.observaciones}\n\n`;
    }

    body += `Saludos,\n${reporte.vendedor}`;

    // Crear enlace mailto con el email configurado
    const mailtoLink = `mailto:${this.emailDestino}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Abrir cliente de email
    window.open(mailtoLink);
  }
}
