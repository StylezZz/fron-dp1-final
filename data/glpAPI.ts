import { th } from "date-fns/locale";

const API_BASE_URL = "http://localhost:8080/api";

const GlpLogisticAPI = {
  simulation: {
    async inicialize(params: {
      anio: number;
      mes: number;
      dia: number;
      horaInicial: number;
      minutoInicial: number;
      minutosPorIteracion: number;
      timerSimulacion: number;
    }) {
      const queryParams = new URLSearchParams({
        anio: params.anio.toString(),
        mes: params.mes.toString(),
        dia: params.dia.toString(),
        horaInicial: params.horaInicial.toString(),
        minutoInicial: params.minutoInicial.toString(),
        minutosPorIteracion: params.minutosPorIteracion.toString(),
        timerSimulacion: params.timerSimulacion.toString(),
      });

      const response = await fetch(
        `${API_BASE_URL}/simulation/iniciar-simulacion?${queryParams.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        }
      );
      return response.json();
    },
  },
  upload: {
    async orders(file: File) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`${API_BASE_URL}/pedidos/leer-pedidos`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.mensaje || `Error HTTP: ${response.status}`);
        }

        return {
          success: true,
          mensaje: result.mensaje,
          status: response.status,
        };
      } catch (error) {
        return {
          success: false,
          mensaje: error instanceof Error ? error.message : "Error desconocido",
          status: 500,
        };
      }
    },
    async blockages(file: File) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`${API_BASE_URL}/bloqueos/leer-bloqueos`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.mensaje || `Error HTTP: ${response.status}`);
        }

        return {
          success: true,
          mensaje: result.mensaje,
          status: response.status,
        };
      } catch (error) {
        return {
          success: false,
          mensaje: error instanceof Error ? error.message : "Error desconocido",
          status: 500,
        };
      }
    },
  },
  files: {
    async getOrdersFile() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/pedidos/nombre-pedidos-archivos`
        );
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        const formattedFiles =
          data.nombresPedidos?.map((filename: string, index: number) => {
            const lowerName = filename.toLowerCase();

            const yearMatch = filename.match(/\b(20\d{2})\b/);
            const year = yearMatch ? yearMatch[1] : null;

            const monthMatch = filename.match(
              /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i
            );
            const month = monthMatch ? monthMatch[1].toLowerCase() : null;

            const monthNumbers: { [key: string]: string } = {
              enero: "01",
              febrero: "02",
              marzo: "03",
              abril: "04",
              mayo: "05",
              junio: "06",
              julio: "07",
              agosto: "08",
              septiembre: "09",
              octubre: "10",
              noviembre: "11",
              diciembre: "12",
            };

            const monthNumber = month ? monthNumbers[month] : null;

            let type = "pedidos";
            let icon = "📦";

            if (lowerName.includes("bloqueo")) {
              type = "bloqueos";
              icon = "🚫";
            } else if (lowerName.includes("ruta")) {
              type = "rutas";
              icon = "🗺️";
            } else if (lowerName.includes("vehiculo")) {
              type = "vehiculos";
              icon = "🚛";
            }

            const sortDate =
              year && monthNumber ? `${year}-${monthNumber}` : "0000-00";

            return {
              id: "file-" + index,
              originalName: filename,
              dispplayName: filename,
              year: year,
              month: month,
              monthNumber: monthNumber,
              type: type,
              icon: icon,
              sortDate: sortDate,
              isRecent:
                year === new Date().getFullYear().toString() &&
                monthNumber ===
                  (new Date().getMonth() + 1).toString().padStart(2, "0"),
              description: `Archivo de ${type} del ${month} de ${year}`,
            };
          }) || [];

        formattedFiles.sort(
          (a: { sortDate: string }, b: { sortDate: string }) =>
            b.sortDate.localeCompare(a.sortDate)
        );

        return {
          success: true,
          mensaje: data.Mensaje,
          files: formattedFiles,
          totalFiles: formattedFiles.length,
          recentFiles: formattedFiles.filter(
            (f: { isRecent: any }) => f.isRecent
          ),
          filesByType: formattedFiles.reduce(
            (acc: { [x: string]: any }, file: { type: string | number }) => {
              acc[file.type] = (acc[file.type] || 0) + 1;
              return acc;
            },
            {} as { [key: string]: number }
          ),
        };
      } catch (error) {
        return {
          success: false,
          mensaje: error instanceof Error ? error.message : "Error desconocido",
          status: 500,
          files: [],
          totalFiles: 0,
          recentFiles: [],
          filesByType: {},
        };
      }
    },
    async getBlockagesFile() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/bloqueos/nombre-bloqueos-archivos`
        );
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        // Similar formateo para archivos de bloqueos
        const formattedFiles =
          data.nombresBloqueos?.map((filename: string, index: number) => {
            // Mismo formateo que arriba pero para bloqueos
            const yearMatch = filename.match(/\b(20\d{2})\b/);
            const year = yearMatch ? yearMatch[1] : null;

            const monthMatch = filename.match(
              /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i
            );
            const month = monthMatch ? monthMatch[1].toLowerCase() : null;

            return {
              id: `blockage-${index}`,
              originalName: filename,
              displayName: filename,
              year: year,
              month: month,
              type: "bloqueos",
              icon: "🚫",
              isRecent: year === new Date().getFullYear().toString(),
              description: `Archivo de bloqueos para ${
                month || "fecha no especificada"
              } ${year || ""}`,
            };
          }) || [];

        return {
          success: true,
          mensaje: data.Mensaje,
          files: formattedFiles,
          totalFiles: formattedFiles.length,
        };
      } catch (error) {
        return {
          success: false,
          mensaje:
            error instanceof Error
              ? error.message
              : "Error desconocido al obtener bloqueos",
          status: 500,
          files: [],
          totalFiles: 0,
        };
      }
    },
  },
};

export default GlpLogisticAPI;
