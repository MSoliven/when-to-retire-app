import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { NavigationEnd, Router, ActivatedRoute } from '@angular/router';

import { Chart, ChartConfiguration, ChartData, ChartEvent, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import DataLabelsPlugin from 'chartjs-plugin-datalabels';
import { FormatUtil } from '../../formatutil';
import { BaseComponent } from 'src/app/base/base.component';

class TableDataRow {
  public year: string;
  public balance: string;
  public contributions: string;

  public constructor(y: string, b: string, c: string) {
    this.year = y;
    this.balance = b;
    this.contributions = c;
  }
}

@Component({
  selector: 'app-when-to-retire',
  templateUrl: './when-to-retire.component.html',
  styleUrls: ['./when-to-retire.component.scss']
})
export class WhenToRetireComponent extends BaseComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  inputForm: any = {};

  public barChartOptions(minY: number, maxX: number): ChartConfiguration['options'] {
    return {
      responsive: true,
      // We use these empty structures as placeholders for dynamic theming.
      scales: {
          x: {
            max: maxX,
            stacked: true
          },
          y: {
            min: minY
          }
        },
        plugins: {
          legend: {
            display: true,
          },
          datalabels: {
            // anchor: 'end',
            // align: 'end',
            display: false
          }
        },
      maintainAspectRatio: false
      };
  }

  public barChartType: ChartType = 'bar';
  public barChartPlugins = [
    DataLabelsPlugin
  ];

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Growth' }
    ]
  };

  public tableDataRows: any[] = [];
  public showTable: boolean = false;
  public disableTable: boolean = false;

  public daysMode: boolean = false;

  public periodLabel: string = "Age";
  public periodContribLabel: string = "Monthly";

  public viewMode:string = "";
  public minY: number = 0;
  public maxY: number = 3000000;
  public maxX: number = 35;

  public retireAge: number = -1;
  public retireBalance: string = "$0.00";
  public retireIncome: string = "$0.00";
  public monthlyRetireIncome: string = "$0.00";
  public futureBalance: string = "$0.00";
  public formattedAmount: string = "";
  
  
  constructor(public override router: Router, public override route: ActivatedRoute, private fb: FormBuilder) { 
    super(router, route);
  }

  override ngOnInit(): void {

    this.route.queryParams
      .subscribe(params => {
        let initial = params["initial"] as string;
        let contrib = params["contrib"] as string;
        let expenses = params["expenses"] as string;
        let rate = params["rate"] as string;
        let age = params["age"] as string;
        let view = params["view"] as string;
        
        this.onInitForm(initial, contrib, expenses, rate, age, view);
        this.onChange(true);
      }
    );


  }

 onInitForm(initial: string, contrib: string, expenses: string, rate: string, age: string, view: string) {

    const getValue = (val: string, def: any) => {
      if (!val) return def;
      return val;
    };

    if (view) {
      switch(view.toLowerCase()) {
        case "readonly":
          this.readOnly = true;
          this.disableTable = false;
          this.compact = true;
          break;
        case "readonlychart":
          this.readOnly = true;
          this.disableTable = true;
          this.compact = true;
          break;
        case "compact":
          this.readOnly = false;
          this.disableTable = false;
          this.compact = true;
          break;
        case "compactchart":
          this.readOnly = false;
          this.disableTable = true;
          this.compact = true;
          break;
        default:
          this.readOnly = false;
          this.disableTable = false;
      }
      this.viewMode = view;
    }

    this.inputForm = this.fb.group({
      initialPrincipal: [getValue(initial, "$100,000.00"), Validators.required],
      monthlyContribution: [getValue(contrib, "$1000.00")],
      monthlyExpenses: [getValue(expenses, "$5000.00")],
      investmentRate: [getValue(rate, "8")],
      currentAge: [getValue(age, "30")],
      viewMode: [getValue(view, "")]
    });
  }

  onChange(init?: boolean) {
    // TODO: Use EventEmitter with form value
    console.warn(this.inputForm.value);
    let input = this.inputForm.value;

    if (!init && input.viewMode) {
      this.onInitForm(input.initialPrincipal, input.monthlyContribution, input.monthlyExpenses, input.investmentRate,
        input.currentAge, input.viewMode);
      input = this.inputForm.value;
    }
    
    let principal = FormatUtil.parseToNumber(input.initialPrincipal);
    let contrib = FormatUtil.parseToNumber(input.monthlyContribution);
    let expenses = FormatUtil.parseToNumber(input.monthlyExpenses);
    let rate = FormatUtil.parseToNumber(input.investmentRate);
    let age = FormatUtil.parseToNumber(input.currentAge);

    // reset retirement age
    this.retireAge = -1;

    this.barChartData.labels = this.calcLabels(input.currentAge as number);
    this.barChartData.datasets = this.calcResultsets(principal, contrib, expenses,
      rate, age, input.viewMode);
    
    this.chart?.update();

    this.showTable = false;
  }

  calcLabels(age: number) : string[] {
    let labels: string[] = [];

    for (let i=age; i <= age + 80; i++) {
      labels.push(this.periodLabel + " " + i);
    }

    return labels;
  }

  calcResultsets(initialPrincipal: number, regularContribs: number, expenses: number, investmentRate: number, age: number, viewmode?: string): any {

      let balances: number[] = [];
      let contributions: number[] = [];
      let compoundRate = investmentRate / 100;
      let balance: number = initialPrincipal;
      let totalContribs: number = initialPrincipal;
      let growth: number;
      let contribs: number = 0;
   
      let expensePerYear = expenses * 12;
      let targetPrincipal = expensePerYear * 25;
   
      const calcGrowth = (balance: number, compoundRate: number): number => {
        return balance * compoundRate;
      };

      for (let i = 0; i <= 80; i++) {
        if (i == 0) {
          balances.push(balance);
          contributions.push(totalContribs);
        }
        else {
          contribs += regularContribs * 12;

          growth = calcGrowth(balance, compoundRate);
          balance += growth + contribs;    

          totalContribs += contribs; 
          contribs = 0;        

          balances.push(balance);
          contributions.push(totalContribs);      

          if (this.retireAge == -1 && balance >= targetPrincipal ) {
            this.retireAge = age + i;
            this.retireBalance = FormatUtil.formatNumber(balance, 0);
            this.retireIncome = FormatUtil.formatNumber(balance * .04, 0);
            this.monthlyRetireIncome = FormatUtil.formatNumber(balance * .04 / 12, 0);
            this.maxX = i;
            break;
          }
        }
      }

      this.futureBalance = FormatUtil.formatNumber(balance);

      if (balance < 0 || initialPrincipal < 0) {
        this.minY = balance < initialPrincipal ? balance : initialPrincipal;
      }
      else {
        this.minY = 0;
      }

      return [{
        data: balances,
        label: "Balance"
      },{
        data: contributions,
        label: "Contributions"
      }];
  }

  generateAndShowTable() {
    
    this.tableDataRows = [];
    this.showTable = !this.showTable ;
    if (this.showTable) {
      for(let i=0; i < this.barChartData.labels!.length; i++) {
        this.tableDataRows.push(new TableDataRow(
          this.barChartData.labels![i] as string,
          FormatUtil.formatNumber(this.barChartData.datasets[0].data[i] as number),
          FormatUtil.formatNumber(this.barChartData.datasets[1].data[i] as number)
        ))
      }
    }
  }
}
