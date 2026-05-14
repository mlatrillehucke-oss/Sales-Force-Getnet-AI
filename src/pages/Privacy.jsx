import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, FileText, Globe } from "lucide-react";

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold font-display tracking-tight">Privacidad y Protección de Datos</h1>
        <p className="text-muted-foreground text-sm mt-1">Cumplimiento normativo para España y Chile</p>
      </div>

      <Tabs defaultValue="rgpd" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="rgpd" className="text-xs gap-1.5"><Globe className="w-3.5 h-3.5" /> RGPD (España/UE)</TabsTrigger>
          <TabsTrigger value="chile" className="text-xs gap-1.5"><Shield className="w-3.5 h-3.5" /> Ley Chile</TabsTrigger>
          <TabsTrigger value="policy" className="text-xs gap-1.5"><FileText className="w-3.5 h-3.5" /> Política Interna</TabsTrigger>
        </TabsList>

        <TabsContent value="rgpd">
          <div className="bg-card rounded-2xl border border-border p-6 prose prose-sm max-w-none">
            <h2 className="text-lg font-bold font-display text-primary">Reglamento General de Protección de Datos (RGPD)</h2>
            <p className="text-muted-foreground">Reglamento (UE) 2016/679 — Aplicable a operaciones en España y la UE.</p>
            
            <h3>1. Responsable del Tratamiento</h3>
            <p>GETNET Servicios de Pago, a través de sus ejecutivos comerciales, actúa como responsable del tratamiento de los datos personales recabados a través de esta aplicación.</p>

            <h3>2. Base Legal</h3>
            <ul>
              <li><strong>Consentimiento explícito</strong> (Art. 6.1.a RGPD): Obtenido mediante checkbox obligatorio en el formulario de cliente.</li>
              <li><strong>Interés legítimo</strong> (Art. 6.1.f RGPD): Para prospección comercial B2B según considerando 47.</li>
              <li><strong>Ejecución contractual</strong> (Art. 6.1.b RGPD): Para la gestión del servicio contratado.</li>
            </ul>

            <h3>3. Datos Recogidos</h3>
            <p>Datos identificativos del negocio (razón social, NIF/CIF), datos del representante legal (nombre, DNI), datos de contacto (dirección, teléfono, email), datos financieros básicos (banco, facturación estimada).</p>

            <h3>4. Finalidad del Tratamiento</h3>
            <ul>
              <li>Gestión comercial y prospección de servicios de pago GETNET</li>
              <li>Evaluación de elegibilidad para productos financieros</li>
              <li>Comunicaciones comerciales relacionadas</li>
              <li>Análisis estadístico agregado (anonimizado)</li>
            </ul>

            <h3>5. Derechos del Interesado</h3>
            <p>Conforme a los artículos 15-22 del RGPD, el interesado puede ejercer los derechos de:</p>
            <ul>
              <li><strong>Acceso</strong>: Conocer qué datos se están tratando.</li>
              <li><strong>Rectificación</strong>: Corregir datos inexactos.</li>
              <li><strong>Supresión</strong>: Solicitar la eliminación ("derecho al olvido").</li>
              <li><strong>Limitación</strong>: Restringir el tratamiento.</li>
              <li><strong>Portabilidad</strong>: Recibir datos en formato estructurado.</li>
              <li><strong>Oposición</strong>: Oponerse al tratamiento.</li>
            </ul>

            <h3>6. Plazo de Conservación</h3>
            <p>Los datos se conservarán durante la relación comercial y hasta 5 años después de su finalización, salvo obligación legal que exija un plazo distinto.</p>

            <h3>7. Medidas de Seguridad</h3>
            <p>Se implementan medidas técnicas y organizativas conforme al Art. 32 RGPD: cifrado de datos, control de accesos, registros de actividad, copias de seguridad y formación del personal.</p>

            <h3>8. Autoridad de Control</h3>
            <p>Agencia Española de Protección de Datos (AEPD) — <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a></p>
          </div>
        </TabsContent>

        <TabsContent value="chile">
          <div className="bg-card rounded-2xl border border-border p-6 prose prose-sm max-w-none">
            <h2 className="text-lg font-bold font-display text-primary">Ley 19.628 sobre Protección de la Vida Privada</h2>
            <p className="text-muted-foreground">Legislación chilena sobre tratamiento de datos personales.</p>

            <h3>1. Marco Legal</h3>
            <p>Esta aplicación cumple con la Ley 19.628 sobre Protección de la Vida Privada (Chile) y sus modificaciones posteriores, incluyendo las disposiciones de la Ley 21.096 que elevó la protección de datos a rango constitucional.</p>

            <h3>2. Consentimiento</h3>
            <p>Conforme al artículo 4° de la Ley 19.628, el tratamiento de datos personales requiere el consentimiento del titular, el cual se recaba de forma expresa e informada mediante el formulario de registro.</p>

            <h3>3. Datos Recogidos</h3>
            <ul>
              <li>Datos del negocio: RUT, razón social, giro comercial</li>
              <li>Datos del representante: nombre, RUN</li>
              <li>Datos de contacto: dirección, teléfono, email</li>
              <li>Datos económicos: banco, cuenta, facturación estimada</li>
            </ul>

            <h3>4. Derechos ARCO</h3>
            <p>El titular tiene derecho a:</p>
            <ul>
              <li><strong>Acceso</strong> (Art. 12): Solicitar información sobre sus datos.</li>
              <li><strong>Rectificación</strong> (Art. 12): Modificar datos erróneos.</li>
              <li><strong>Cancelación</strong> (Art. 12): Solicitar eliminación de datos.</li>
              <li><strong>Oposición</strong>: Negarse al uso de sus datos para fines no autorizados.</li>
            </ul>

            <h3>5. Responsable del Registro</h3>
            <p>GETNET Servicios de Pago — Los datos se almacenan en sistemas protegidos con medidas de seguridad adecuadas conforme al artículo 11 de la Ley 19.628.</p>

            <h3>6. Transferencia Internacional</h3>
            <p>En caso de transferencia internacional de datos, se cumplirá con lo dispuesto en el artículo 5° de la Ley 19.628 y las garantías equivalentes requeridas.</p>

            <h3>7. Autoridad de Control</h3>
            <p>Consejo para la Transparencia — <a href="https://www.consejotransparencia.cl" target="_blank" rel="noopener noreferrer">www.consejotransparencia.cl</a></p>
          </div>
        </TabsContent>

        <TabsContent value="policy">
          <div className="bg-card rounded-2xl border border-border p-6 prose prose-sm max-w-none">
            <h2 className="text-lg font-bold font-display text-primary">Política Interna de Protección de Datos</h2>
            <p className="text-muted-foreground">Lineamientos internos para ejecutivos comerciales GETNET.</p>

            <h3>1. Principios Generales</h3>
            <ul>
              <li><strong>Minimización</strong>: Recoger solo los datos estrictamente necesarios.</li>
              <li><strong>Exactitud</strong>: Mantener los datos actualizados y correctos.</li>
              <li><strong>Confidencialidad</strong>: No compartir datos con terceros no autorizados.</li>
              <li><strong>Seguridad</strong>: Proteger los datos con las medidas adecuadas.</li>
            </ul>

            <h3>2. Obligaciones del Ejecutivo</h3>
            <ul>
              <li>Obtener siempre el consentimiento antes de registrar datos.</li>
              <li>Informar al cliente del uso que se dará a sus datos.</li>
              <li>No almacenar datos en dispositivos personales no autorizados.</li>
              <li>Reportar inmediatamente cualquier brecha de seguridad.</li>
              <li>Eliminar datos cuando el cliente lo solicite.</li>
            </ul>

            <h3>3. Uso de la Inteligencia Artificial</h3>
            <p>La IA integrada en esta aplicación se utiliza exclusivamente para:</p>
            <ul>
              <li>Búsqueda y sugerencia de comercios potenciales (datos públicos).</li>
              <li>Optimización de rutas comerciales.</li>
              <li>Análisis estadístico agregado (sin datos personales identificables).</li>
              <li>Generación de estrategias comerciales basadas en métricas.</li>
            </ul>
            <p>Los datos personales de los clientes NO se utilizan para entrenar modelos de IA ni se comparten con proveedores de IA.</p>

            <h3>4. Retención y Eliminación</h3>
            <ul>
              <li>Prospectos no convertidos: 12 meses máximo.</li>
              <li>Clientes activos: durante la relación comercial + 5 años.</li>
              <li>Datos de navegación y uso: 6 meses.</li>
            </ul>

            <h3>5. Contacto DPO</h3>
            <p>Para consultas sobre protección de datos, contactar al Delegado de Protección de Datos (DPO) a través de los canales internos establecidos.</p>

            <h3>6. Cookies y Tecnologías de Seguimiento</h3>
            <p>Esta aplicación utiliza cookies técnicas necesarias para su funcionamiento. No se utilizan cookies de seguimiento ni publicidad.</p>

            <h3>7. Actualizaciones</h3>
            <p>Esta política se revisa y actualiza periódicamente. Última actualización: Abril 2026.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}