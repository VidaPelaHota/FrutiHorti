export function getExpirationStatus(dataValidade) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validade = new Date(dataValidade);
    validade.setHours(0, 0, 0, 0);

    const diffDays = Math.round((validade - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { variant: "expired", label: "Vencido" };
    }

    if (diffDays === 0) {
        return { variant: "warning", label: "Vence hoje" };
    }

    if (diffDays === 1) {
        return { variant: "warning", label: "Vence amanhã" };
    }

    if (diffDays <= 2) {
        return { variant: "warning", label: `Vence em ${diffDays} dias` };
    }

    const formatted = validade.toLocaleDateString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric"
    });

    return { variant: "valid", label: `Válido até ${formatted}` };
}