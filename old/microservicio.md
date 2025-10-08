# Nombre del microservicio 

---
## Control del documento

- **Nombre del servicio**: El nombre debe ser igual al del HLS. 
- **Proyecto**: Indicar el nombre del proyecto (por ejemplo, WhatsApp). **Nota:** Este valor debe coincidir exactamente con el contenido del campo `PROYECTO` en el archivo `.params`.
- **Namespace**: Indicar el namespace productivo.
- **Tecnología**: Springboot-Maven, Springboot-Gradle, NestJS, NodeJS y Apache Camel.
- **Fábrica**: Indicar la fábrica encargada del desarrollo.

---
## Alcance

**Objetivo del microservicio**: Descripción breve y clara de la funcionalidad del microservicio.

**Nota:** El contenido debe ser coherente con la información proporcionada en el campo `DESCRIPTION` del archivo `.params`.

---
## Referencias


| **Referencia** | **Endpoint** |
|--|--|
| Swagger | Ejemplo: /api |

---

## Diagramas

### Diagrama de componentes de solución

Imagen legible del diagrama de componentes.

Ejemplo:
![Diagrama de componentes](./images/diagrama_componentes.png)

### Diagrama de secuencia

Imagen legible del diagrama de secuencia.

Ejemplo:
![Diagrama de secuencia](./images/diagrama_secuencia.png)

---

## Diseño de componentes lógicos de la solución

### Entidades de negocio 

Especificar si aplica exposición por 3scale o API Gateway. Sin embargo, no se deben exponer las credenciales o contraseñas de dichas exposiciones.

Ejemplos:

a) Cuando el microservicio se consume a través de 3scale

| **_API Management_ (3scale/API Gateway)** | **Aplica** | **URL** |
|--|--|--|
| 3scale | ✅ | https://apimejemplo-3scale-apicast-production.apps.ocpprd.claro.co/MS/COM/Performance/RSReTeSpeTestPlatform/V1/ValidateTest | 

b) Cuando el microservicio se consume a través de API Gateway

| **_API Management_ (3scale/API Gateway)** | **Aplica** | **URL** |
|--|--|--|
| API Gateway | ✅ | https://apim.claro.com.co/apimejemplo/MS/COM/Performance/RSReTeSpeTestPlatform/V1/ValidateTest  | 

c) Cuando el microservicio se consume directamente por ruta (no por 3scale ni API Gateway) o cuando el microservicio es un servicio legado (es decir, un microservicio orquestador consume este microservicio). En este caso, su consumo no depende de la exposición de una API.

| **_API Management_ (3scale/API Gateway)** | **Aplica** | **URL** |
|--|--|--|
| 3scale | ❌ | ❌ | 
| API Gateway | ❌ | ❌ | 

### Enriquecimiento/Transformación

En esta sección se deben indicar cada uno de los métodos del microservicio. La información de cada método debe incluir la descripción, el *path*, *headers*, parámetros (si aplica), *body* (si aplica).

- **Método 1:** Indicar el método (GET/POST/PUT/PATCH/DELETE) - Descripción clara del método

| **Mapeo de campos** | **Descripción** |
|--|--|
| Método | GET/POST/PUT/PATCH/DELETE |
| URL|  |
| Descripción |  |
| _Request headers_ |  |

**Request (*Parameters*/*Body*)**

_Parameters_ (si aplica, por ejemplo en métodos `GET`)

| **Nombre del parámetro** | **Tipo** | **Obligatoriedad** | **Descripción** | **Valor de prueba** |
|--|--|--|--|--|
| | |  |  |  |
| | |  |  |  |
| | |  |  |  |

Body (si aplica, por ejemplo en métodos `POST`, `PUT`, `PATCH`)
```JSON
{}

```

Response

```JSON
{}

```

Ejemplo:
- **Método 1:** GET - Consulta de datos demográficos 

| **Mapeo de campos** | **Descripción** |
|--|--|
| Método | GET |
| URL| http://localhost:8080/get/CustomerData?tipoConsulta=D&datosConsUno=1&datosConsDos=1116440512 |
| Descripción | Realiza el consumo del procedimiento almacenado: SYSADM.PKG_UTL_BSCS.PRC_OBT_DATOS_CLIENTE_ESTADO para obtener los datos demográficos de un cliente móvil a partir del min |
| _Request headers_* | N/A |

\* No exponer información sensible (token, contraseñas, etc.).

**Request (*Parameters*/*Body*)**

_Parameters_ 

Ejemplo:
| **Nombre del parámetro** | **Tipo** | **Obligatoriedad** | **Descripción** | **Valor de prueba** |
|--|--|--|--|--|
| tipoConsulta | String | ✅ | Número móvil | 3102330333 |
| datosConsUno | String | ✅ | Número de documento (cédula) | 1090777777 |
| datosConsDos | String | ✅ | Seleccionar alguna de estas opciones: 1, 2, 3, 4 | 1 |

_Response_

```JSON
{
    "responseCode": 200,
    "messageCode": "OK",
    "message": "OK",
    "legacy": "/web/services/CLCCAGR00_",
    "timestamp": "2025-07-30T16:51:51.796Z",
    "transactionId": "0ac953bc-4a26-4fef-a8c2-bc15795a6425",
    "data": {
        "code": 0,
        "message": "Consulta exitosa",
        "account": "21483002",
        "isActiveUser": "1",
        "hasArrears": "1",
        "nonMultiplayNon": "1",
        "isCycleChangeEligible": "1",
        "cicleOption": "1",
        "currentCycle": "02",
        "currentBillingDate": "20250702",
        "currentCustomerCount": 961661,
        "cycleProposals": [
            {
                "cycle": "10",
                "billingDate": "20250710",
                "customerCount": "4310"
            },
            {
                "cycle": "17",
                "billingDate": "20250717",
                "customerCount": "15915"
            },
            {
                "cycle": "",
                "billingDate": "",
                "customerCount": ""
            }
        ]
    }
}

```
**Nota**: En caso de ser un suscriptor de Kafka, indicar el nombre del microservicio publicador.

----
## Capa de datos

#### Consumo de servicios SOAP/REST/GraphQL

- **Tipo:** Tipo de legado (p. ej., SOAP).

- **Métodos disponibles u operaciones:** Detalle de los métodos disponibles.

- **URL o _Endpoint_:** Explicación del formato.

- **Ejemplo de consumo:** Ejemplo de cómo consumir el legado (p. ej., SOAP).

#### Consumo de base de datos

- **Conexión a la base de datos:** Detalles de conexión*.
- **Consultas:** Indicar las consultas, procedimientos almacenados o colecciones que utiliza el microservicio.

  - Colección/Procedimiento A
  - Colección/Procedimiento B

- **Consulta SQL:** Ejemplo de consulta, parámetros de entrada y de salida, respuesta esperada.

Ejemplo:
| **Parámetro** | **Tipo de dato** | **Tipo (Entrada/Salida)** | **Descripción**                        | **Ejemplo**            |
|-----------|--------------|------------------------|------------------------------------|---------------------|
| idCliente | INT          | Entrada                | Identificador del cliente          | 10245               |
| fechaIni  | DATE         | Entrada                | Fecha inicial del rango de consulta| 2025-01-01          |
| fechaFin  | DATE         | Entrada                | Fecha final del rango de consulta  | 2025-01-31          |
| saldo     | DECIMAL      | Salida                 | Saldo total del cliente            | 3450.75             |
| estado    | VARCHAR(10)  | Salida                 | Estado de la cuenta                | ACTIVO              |

#### Consumo de otros legados

- **Tipo:** Tipo de legado (p. ej., PCML, SFTP, SMTP).

- **Nombre:** Nombre del legado (p. ej., RR).

- **URL o _Endpoint_:** Por el cual se realiza la conexión.

- **Ejemplo de consumo:** Especificar un ejemplo de consumo del legado. Si no aplica, especificar el motivo. 

\* No exponer información sensible como contraseñas de conexión a la BD.

---  

## Matriz de Escalamiento

La matriz de escalamiento se debe tener para cada uno de los legados evidenciados en el HLS. **Nota:** El equipo de operaciones OpenShift verificará que los números de teléfono proporcionados sean válidos y se ajusten al nivel jerárquico especificado. 

| **Legado** | **Grupo Mi Asistencia 360*** | **Nivel 1** | **Nivel 2** | **Dueño de la aplicación (Claro)** |
|--|--|--|--|--|
|  |  |  |  |  |
|  |  |  |  |  |


