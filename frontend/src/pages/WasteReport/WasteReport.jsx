import { useEffect, useState } from 'react';
import './WasteReport.css';
import '../../components/StockTable/StockTable.css';

import { Trash2, PackageX, BadgePercent, PiggyBank } from "lucide-react";

import InfoCard from "../../components/InfoCard/InfoCard";
import { Text } from "../../styles/globalStyles";
import { getWasteReport } from "../../services/reportsApi.js";
import { formatCurrency } from "../../utils/currency.js";
import { formatDateOnly } from "../../utils/productStatus.js";

// The result is tagged with the month it belongs to, so "loading" is derived instead of set inside the effect.
function useWasteReport(month) {
    const requestKey = month ?? 'current';
    const [result, setResult] = useState({ requestKey: null, report: null, error: null });

    useEffect(() => {
        let isCurrent = true;
        getWasteReport(month)
            .then((report) => isCurrent && setResult({ requestKey, report, error: null }))
            .catch((err) => isCurrent && setResult({ requestKey, report: null, error: err.message }));
        return () => { isCurrent = false; };
    }, [month, requestKey]);

    const isLoaded = result.requestKey === requestKey;
    return { report: isLoaded ? result.report : null, error: isLoaded ? result.error : null, loading: !isLoaded };
}

const ReportCounters = ({ summary }) => (
    <div className="stockCards">
        <InfoCard icon={<Trash2 size={20} />} title="Valor perdido" content={formatCurrency(summary.valor_perdido)} variant="danger" />
        <InfoCard icon={<PackageX size={20} />} title="Unidades perdidas" content={summary.quantidade_perdida} variant="danger" />
        <InfoCard icon={<BadgePercent size={20} />} title="Vendidas com desconto" content={summary.quantidade_vendida_com_desconto} variant="warning" />
        <InfoCard icon={<PiggyBank size={20} />} title="Receita salva com desconto" content={formatCurrency(summary.receita_com_desconto)} variant="default" />
    </div>
);

const LossTable = ({ title, rows, firstColumn, renderFirst }) => (
    <section className="wasteReportSection">
        <Text fontSize="1.6rem" fontWeight="700">{title}</Text>
        {rows.length === 0 ? (
            <p className="stockTableEmpty">Nenhuma perda registrada no período.</p>
        ) : (
            <table className="stockTable">
                <thead>
                    <tr><th>{firstColumn}</th><th>Unidades</th><th>Valor perdido</th></tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={renderFirst(row)}>
                            <td>{renderFirst(row)}</td>
                            <td>{row.quantidade}</td>
                            <td>{formatCurrency(row.valor)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
    </section>
);

const PendingExpiredNotice = ({ pending }) => {
    if (!pending || pending.quantidade === 0) return null;
    return (
        <p className="wasteReportNotice" role="status">
            {pending.quantidade} un. ({formatCurrency(pending.valor)}) ainda estão em lotes vencidos e precisam de baixa como perda
            no estoque: {pending.produtos.map((product) => product.nome).join(', ')}.
        </p>
    );
};

const ReportBody = ({ report }) => (
    <>
        <ReportCounters summary={report.resumo} />
        <div className="wasteReportContent">
            <PendingExpiredNotice pending={report.estoque_vencido_pendente} />
            {report.resumo.valor_estimado && (
                <p className="wasteReportHint">
                    Parte das perdas foi registrada antes do preço ser gravado na saída; elas foram valorizadas pelo preço atual.
                </p>
            )}
            <LossTable title="Perdas por produto" rows={report.por_produto} firstColumn="Produto" renderFirst={(row) => row.nome} />
            <LossTable title="Perdas por categoria" rows={report.por_categoria} firstColumn="Categoria" renderFirst={(row) => row.categoria} />
        </div>
    </>
);

const WasteReport = () => {
    const [month, setMonth] = useState('');
    const { report, loading, error } = useWasteReport(month || undefined);

    return (
        <div className="stockApp">
            <div className="stockTitle">
                <div className="titleText">
                    <Text fontSize="2.4rem" fontFamily="Lora, serif" fontWeight="bold">Relatório de desperdício</Text>
                    <Text fontSize="1.2rem">
                        {report ? `Perdas de ${formatDateOnly(report.periodo.inicio)} a ${formatDateOnly(report.periodo.fim)}` : 'Perdas registradas no mês'}
                    </Text>
                </div>
                <label className="wasteReportMonth">
                    Mês
                    <input type="month" value={month || report?.mes || ''} onChange={(event) => setMonth(event.target.value)} />
                </label>
            </div>

            {loading && <Text className="homepageStatus" fontSize="1.2rem">Carregando relatório...</Text>}
            {!loading && error && (
                <Text className="homepageStatus" fontSize="1.2rem" color="var(--solid-red)">Não foi possível carregar o relatório: {error}</Text>
            )}
            {!loading && report && <ReportBody report={report} />}
        </div>
    );
};

export default WasteReport;
