import { useState } from "react";
import { ArrowLeft, MapPin, CheckCircle2, LocateFixed } from "lucide-react";

interface ReportIncidentProps {
  onBack: () => void;
  onNext: () => void;
  onSave: (report: {
    type: string;
    location: string;
    description: string;
  }) => void;
}

export default function ReportIncident({ onBack, onNext, onSave }: ReportIncidentProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // Estados extras para guardar a geolocalização exata capturada pelo botão
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingGps, setLoadingGps] = useState(false);

  const types = [
    "Assédio",
    "Agressão",
    "Roubo/Furto",
    "Importunação",
    "Perseguição",
    "Outro",
  ];

  // Captura as coordenadas físicas reais via API do navegador e converte em bairro
  const handleCapturarGps = () => {
    if (!("geolocation" in navigator)) return;

    setLoadingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGeoCoords({ lat, lng });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
          );
          const data = await res.json();
          const bairro =
            data.address?.suburb ||
            data.address?.neighbourhood ||
            data.address?.city_district ||
            data.address?.city ||
            "Bairro não identificado";

          setLocation(bairro);
        } catch (err) {
          console.error("Erro ao buscar bairro:", err);
          setLocation("Bairro não identificado");
        } finally {
          setLoadingGps(false);
        }
      },
      (error) => {
        console.error("Erro ao capturar coordenadas:", error);
        setLoadingGps(false);
        alert("Não foi possível obter sua localização. Ative o GPS do aparelho.");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleConfirm = () => {
    // 1. Cria a estrutura injetando latitude e longitude reais caso tenham sido capturadas
    const novaOcorrencia = {
      id: `local-rep-${Date.now()}`,
      tipo: selectedType.toLowerCase().replace("/", "_"),
      bairro: location || "Local Desconhecido",
      status: "pendente",
      descricao: description,
      latitude: geoCoords?.lat || null,
      longitude: geoCoords?.lng || null,
      criado_em: new Date().toISOString()
    };

    // 2. Recupera o histórico do localStorage, adiciona o novo e salva de volta
    const historicoSalvo = localStorage.getItem("mock_denuncias");
    const listaOcorrencias = historicoSalvo ? JSON.parse(historicoSalvo) : [];
    listaOcorrencias.unshift(novaOcorrencia);
    localStorage.setItem("mock_denuncias", JSON.stringify(listaOcorrencias));

    // Executa o callback original do fluxo do app
    onSave({
      type: selectedType,
      location,
      description,
    });

    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    onNext();
  };

  return (
    <div className="w-full h-screen bg-[#fafafa] flex flex-col relative">
      <div className="px-5 py-6 flex-1 overflow-y-auto">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center mb-6 active:scale-95 transition-transform bg-white"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>

        <h1 className="text-2xl font-bold text-pink-500 mb-6">
          Reportar Incidente
        </h1>

        {/* Tipo de Ocorrência */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-3">
            Tipo de Ocorrência
          </p>

          <div className="flex flex-wrap gap-3">
            {types.map((item) => (
              <button
                key={item}
                onClick={() => setSelectedType(item)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all active:scale-95 ${
                  selectedType === item
                    ? "border-pink-500 bg-pink-50 text-pink-600"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Endereço + Botão GPS Integrado */}
        <div className="border border-gray-200 rounded-xl p-4 bg-white mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin size={18} />
              <span className="text-sm">Endereço da Ocorrência</span>
            </div>

            {/* Botão de captura de GPS */}
            <button
              type="button"
              onClick={handleCapturarGps}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors active:scale-95 ${
                geoCoords
                  ? "bg-green-50 text-green-600 border-green-200"
                  : "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100"
              }`}
            >
              <LocateFixed size={14} className={loadingGps ? "animate-spin" : ""} />
              {loadingGps ? "Obtendo..." : geoCoords ? "GPS Ativo" : "Usar GPS"}
            </button>
          </div>

          <input
            type="text"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              if (geoCoords) setGeoCoords(null);
            }}
            placeholder="Buscar endereço ou capturar pelo GPS..."
            className="w-full bg-[#f5f5f5] rounded-xl px-4 py-3 outline-none border border-transparent focus:border-pink-200 focus:bg-white transition-all text-sm"
          />
        </div>

        {/* Descrição */}
        <div className="border border-gray-200 rounded-xl p-4 bg-white mb-8">
          <p className="text-sm text-gray-500 mb-3">
            Descrição
          </p>

          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva aqui o ocorrido..."
            className="w-full bg-[#f5f5f5] rounded-xl px-4 py-3 outline-none resize-none border border-transparent focus:border-pink-200 focus:bg-white transition-all text-sm"
          />
        </div>

        {/* Botão de Envio */}
        <button
          onClick={handleConfirm}
          disabled={!selectedType || !location || !description}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-semibold active:scale-[0.99] transition-transform shadow-lg shadow-pink-100"
        >
          Confirmar Ocorrência
        </button>
      </div>

      {/* POPUP DE SUCESSO */}
      {showModal && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500">
              <CheckCircle2 size={38} className="fill-green-50 stroke-green-500" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-gray-800">Ocorrência Salva!</h4>
              <p className="text-sm text-gray-500 mt-2">
                O incidente foi registrado anonimamente no armazenamento local com sucesso.
              </p>
            </div>

            <button
              onClick={handleModalClose}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium text-sm mt-2 active:scale-95 transition-transform"
            >
              Visualizar Relatórios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}