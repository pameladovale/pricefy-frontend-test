export interface IPromocao {
    gtin: string;
    descricao: string;
    categoria: string;
    precoRegular: number;
    precoPromocional: number;
    dataInicial: Date;
    dataFinal: Date;
    status: string;
}