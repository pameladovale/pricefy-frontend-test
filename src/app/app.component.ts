import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { IPromocao } from './cadastro-promocoes/cadastro-promocoes.interface';
declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  constructor(public datepipe: DatePipe, private toastr: ToastrService) { }

  title = 'pricefy-frontend-test';
  promocao: any;
  listaPromocoes: IPromocao[] = [];
  editar?: IPromocao = undefined;
  novo: boolean = false;
  today = new Date();

  ngOnInit() {
    this.listaPromocoes = this.getPromocoes();
  }

  ngAfterViewInit() {
    this.createDatatable();
  }

  // cria o datatable
  createDatatable() {
    var excluir = '<div class="d-flex justify-content-center"><button class="excluir btn btn-light btn-sm"><i class="fas fa-trash-alt excluir"></i></button><div>';
    var editar = '<div class="d-flex justify-content-center"><button class="editar btn btn-light btn-sm" data-bs-toggle="modal" data-bs-target="#modalCadastro"><i class="fas fa-pen editar"></i></button></div>';
    var table = $('#promocoes').DataTable({
      data: this.getPromocoes(),
      responsive: true,
      select: true,
      language: {
        "lengthMenu": "Mostrar _MENU_ resultados por página",
        "zeroRecords": "Nenhum registro encontrado.",
        "info": "Mostrando _PAGE_ página de _PAGES_",
        "infoEmpty": "Nenhum registro disponível",
        "infoFiltered": "(filtrado de um total de _MAX_ registros)",
        "search": "Buscar:",
        "paginate": {
          "first": "Primeira",
          "last": "Última",
          "next": "Próxima",
          "previous": "Anterior"
        },
      },
      initComplete: (settings: any, json: any) => {
        $('#promocoes tbody').on('click', 'tr', (value: any) => {
          let tr = $(value)[0].currentTarget;

          // adiciona classe selected na linha selecionada
          if ($(tr).hasClass('selected')) {
            $(tr).removeClass('selected');
          } else {
            table.$('tr.selected').removeClass('selected');
            $(tr).addClass('selected');
          }

          // ao clicar no botão excluir
          if ($(value.target).hasClass("excluir")) {
            var data = table.row($(tr)).data();
            let item = this.listaPromocoes.find((promocao: { gtin: any; }) => promocao.gtin == data.gtin)
            if (item != undefined) {
              // remove o item na posição encontrada
              this.listaPromocoes.splice(this.listaPromocoes.indexOf(item), 1);
              // substitui a lista atualizada
              localStorage.setItem("ListaPromocoes", JSON.stringify(this.listaPromocoes));
            }
            // atualiza datatable
            $("#promocoes").DataTable().clear().rows.add(this.listaPromocoes).draw();
          }

          // ao clicar no botão editar
          if ($(value.target).hasClass("editar")) {
            var data = table.row($(tr)).data();

            // converte dataInicial e dataFinal de volta para o formato original
            // converte precoRegular e precoPromocional de volta para o formato original
            let dataInicial = data.dataInicial.split('/');
            let dataFinal = data.dataFinal.split('/');
            let precoRegular = data.precoRegular.toString().replace('R$', '').replace('.', '').replace(',', '.');
            let precoPromocional = data.precoPromocional.toString().replace('R$', '').replace('.', '').replace(',', '.');
            let dadosEdicao = <IPromocao>{
              gtin: data.gtin,
              descricao: data.descricao,
              categoria: data.categoria,
              precoRegular: precoRegular,
              precoPromocional: precoPromocional,
              dataInicial: new Date(+dataInicial[2], dataInicial[1] - 1, +dataInicial[0]),
              dataFinal: new Date(+dataFinal[2], dataFinal[1] - 1, +dataFinal[0]),
              status: data.status
            }

            this.editar = dadosEdicao;
            this.novo = false;
          }
        });
      },
      columnDefs: [
        { title: '', targets: 0 },
        { title: '', targets: 1 },
        { title: 'Status', targets: 2 },
        { title: 'GTIN', targets: 3 },
        { title: 'Descrição completa', targets: 4 },
        { title: 'Categoria', targets: 5 },
        { title: 'Preço regular', targets: 6 },
        { title: 'Preço promocional', targets: 7 },
        { title: 'Data inicial', targets: 8 },
        { title: 'Data final', targets: 9 },
      ],
      columns: [
        { data: 'excluir', defaultContent: excluir },
        { data: 'editar', defaultContent: editar },
        { data: 'status' },
        { data: 'gtin' },
        { data: 'descricao' },
        { data: 'categoria' },
        { data: 'precoRegular' },
        { data: 'precoPromocional' },
        { data: 'dataInicial' },
        { data: 'dataFinal' },
      ]
    });
  }

  // salva a promoção no datatable
  aoSalvar($event: any) {
    // se estiver cadastrando e adicionar gtin já existente...
    if (this.editar == undefined && this.listaPromocoes.filter(promocao => promocao.gtin == $event.gtin).length > 0) {
      this.toastr.error('O valor do campo GTIN já existe. Digite outro valor.', 'Ops!');
      return;
    }

    // se estiver editando
    if (this.editar != undefined) {
      console.log(this.editar)
      let item = this.listaPromocoes.find(promocao => promocao.gtin == $event.gtin)
      if (item != undefined) {
        // remove o item selecionado
        this.listaPromocoes.splice(this.listaPromocoes.indexOf(item), 1)
      }
    }

    // converte as data para o formato brasileiro
    $event.dataInicial = this.datepipe.transform($event.dataInicial, 'dd/MM/yyyy');
    $event.dataFinal = this.datepipe.transform($event.dataFinal, 'dd/MM/yyyy');

    // converte os valores para o formato brasileiro
    $event.precoRegular = this.formatCurrencyValue($event.precoRegular);
    $event.precoPromocional = this.formatCurrencyValue($event.precoPromocional);

    // adiciona atualizado
    this.listaPromocoes.push($event);

    // atualiza o datatable
    $('#promocoes').DataTable().row.add($event).draw();

    // atualiza a lista de promoções
    localStorage.setItem("ListaPromocoes", JSON.stringify(this.listaPromocoes));
    this.novo = false;
    this.getPromocoes();
    $("#promocoes").DataTable().clear().rows.add(this.listaPromocoes).draw();
  }

  formatCurrencyValue(valor: number) {
    if (valor == null) return;
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  // retorna a lista de promocoes - datatable preenchido
  getPromocoes() {
    var lista = localStorage.getItem("ListaPromocoes");
    if (lista != null) {
      this.listaPromocoes = JSON.parse(lista);

      // badges de promoção concluída ou em andamento
      this.listaPromocoes.forEach(promocao => {
        let dataFinal = promocao.dataFinal.toString().split('/');
        if (new Date(+dataFinal[2], +dataFinal[1] - 1, +dataFinal[0]) < this.today) {
          promocao.status = '<span class="badge bg-danger">Concluída</span>';
        } else {
          promocao.status = '<span class="badge bg-success">Em andamento</span>';
        }
      })
    }
    return this.listaPromocoes;
  }

  // abrir modal limpo para cadastro
  abrirCadastro() {
    this.editar = undefined;
    this.novo = true;
  }
}