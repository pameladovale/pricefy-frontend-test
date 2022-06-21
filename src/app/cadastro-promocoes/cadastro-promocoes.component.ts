import { CurrencyPipe, DatePipe } from "@angular/common";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { IPromocao } from './cadastro-promocoes.interface';
declare var $: any;

@Component({
    selector: 'app-cadastro-promocoes',
    templateUrl: './cadastro-promocoes.component.html',
    styleUrls: ['./cadastro-promocoes.component.scss']
})

export class CadastroPromocoesComponent implements OnInit {
    constructor(public datepipe: DatePipe, private currencyPipe: CurrencyPipe, private toastr: ToastrService) { }

    // trigger para trazer valores no formulário
    @Input("editar") set setEditar(value: any) {
        if (value == undefined) return;
        this.edicao = true;
        if (this.formulario != undefined) {
            this.formulario.get('gtin')?.disable();
            this.formulario.setValue({
                gtin: value.gtin,
                descricao: value.descricao,
                categoria: value.categoria,
                precoRegular: value.precoRegular,
                precoPromocional: value.precoPromocional,
                dataInicial: this.datepipe.transform(value.dataInicial, 'yyyy-MM-dd'),
                dataFinal: this.datepipe.transform(value.dataFinal, 'yyyy-MM-dd'),
                status: value.status
            })
        }
    }

    // trigger para limpar formulário e cadastrar nova promoção
    @Input("novo") set setNovo(value: boolean) {
        if (!value) return;
        this.edicao = false;
        this.formulario.get('gtin')?.enable();
        this.formulario.reset();
    }

    // trigger para atualizar a listagem no app
    @Output() aoSalvar = new EventEmitter<any>();

    dataMinimaFinal?: string = '';
    show: boolean = false;
    edicao: boolean = false;

    // criando form group
    formulario: FormGroup = new FormGroup({
        gtin: new FormControl(null, [Validators.required, Validators.maxLength(14)]),
        descricao: new FormControl(null, [Validators.required, Validators.maxLength(100)]),
        categoria: new FormControl(null, Validators.required),
        precoRegular: new FormControl(null, Validators.required),
        precoPromocional: new FormControl(null, Validators.required),
        dataInicial: new FormControl(null, Validators.required),
        dataFinal: new FormControl(null, Validators.required),
        status: new FormControl(null, null)
    });

    ngOnInit() {
        // não deixa escolher data retroativa
        $(() => {
            var dtToday = new Date();

            var month: string = (dtToday.getMonth() + 1).toString();
            var day: string = (dtToday.getDate()).toString();
            var year = dtToday.getFullYear();
            if (+month < 10) {
                month = '0' + month.toString();
            }
            if (+day < 10) {
                day = '0' + day.toString();
            }

            var minDate = year + '-' + month + '-' + day;

            $('#dataInicial').attr('min', minDate);
        });

        // verifica quando o valor de dataInicial é alterado para que o valor da dataFinal não possa ser menor que a dataInicial
        this.formulario.get('dataInicial')?.valueChanges.subscribe(value => {
            this.dataMinimaFinal = (this.datepipe.transform(value, 'yyyy-MM-dd'))?.toString();
        })
    }

    // botão salvar
    salvarPromocao() {
        // verifica se o formulario está preenchido
        if (!this.formulario.valid) {
            this.toastr.error('Preencha todos os campos para cadastrar uma promoção válida!', 'Ops!');
            return;
        }

        // se estiver cadastrando e adicionar gtin já existente...
        if (!this.edicao && this.gtinInvalido(this.formulario.get('gtin')?.value)) {
            this.toastr.error('O valor do campo GTIN já existe. Digite outro valor.', 'Ops!');
            return;
        }

        // se tudo estiver certo...
        $('#modalCadastro').modal('hide');

        if (this.edicao) {
            this.toastr.success('Promoção atualizada com sucesso!', '');
        } else {
            this.toastr.success('Promoção cadastrada com sucesso!', '');
        }
        
        // pega os valores do formulario e envia para o app atualizar a lista
        let promocao: IPromocao = <IPromocao> {
            gtin: this.formulario.get('gtin')?.value,
            descricao: this.formulario.get('descricao')?.value,
            categoria: this.formulario.get('categoria')?.value,
            precoRegular: this.formulario.get('precoRegular')?.value,
            precoPromocional: this.formulario.get('precoPromocional')?.value,
            dataInicial: this.formulario.get('dataInicial')?.value,
            dataFinal: this.formulario.get('dataFinal')?.value,
            status: ''
        }

        this.aoSalvar.emit(promocao);
    }

    // limpa o formulário
    onCancelar() {
        this.formulario.reset();
    }

    // verifica se o valor do campo gtin já existe
    gtinInvalido(gtin: string) {
        var lista = localStorage.getItem("ListaPromocoes");
        if (lista != null) {
            let listaPromocoes = JSON.parse(lista) as IPromocao[];
            if (listaPromocoes.filter(promocao => promocao.gtin == gtin).length > 0) return true;
        }

        return false;
    }
}