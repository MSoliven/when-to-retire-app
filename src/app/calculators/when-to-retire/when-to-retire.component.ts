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
  public value1: string;
  public value2: string;

  public constructor(y: string, b: string, c: string) {
    this.year = y;
    this.value1 = b;
    this.value2 = c;
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
  public lineChartOptions(minY: number, maxX: number): ChartConfiguration['options'] {
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
  public lineChartType: ChartType = 'line';
  
  public chartPlugins = [
    DataLabelsPlugin
  ];

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Growth' }
    ]
  };

  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Growth' }
    ]
  };

  public tableDataRows: any[] = [];
  public showTable: boolean = false;
  public disableTable: boolean = false;
  public showAsset: boolean = false;

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
        let inflate = params["inflate"] as string;
        let rate = params["rate"] as string;
        let swr = params["swr"] as string;
        let age = params["age"] as string;
        let view = params["view"] as string;
        
        this.onInitForm(initial, contrib, expenses, inflate, rate, swr, age, view);
        this.onChange(true);
      }
    );


  }

  onInitForm(initial: string, contrib: string, expenses: string, inflate: string, rate: string, swr: string, age: string, view: string) {

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
      initialPrincipal: [getValue(initial, "$100,000"), Validators.required],
      monthlyContribution: [getValue(contrib, "$1000")],
      monthlyExpenses: [getValue(expenses, "$5000")],
      inflationRate: [getValue(inflate, "3")],
      investmentRate: [getValue(rate, "8")],
      safeWithdrawRate: [getValue(swr, "4")],
      currentAge: [getValue(age, "30")],
      viewMode: [getValue(view, "")]
    });
  }

  onChange(init?: boolean) {
    // TODO: Use EventEmitter with form value
    console.warn(this.inputForm.value);
    let input = this.inputForm.value;

    if (!init && input.viewMode) {
      this.onInitForm(input.initialPrincipal, input.monthlyContribution, input.monthlyExpenses, input.inflationRate,
        input.investmentRate, input.safeWithdrawRate, input.currentAge, input.viewMode);
      input = this.inputForm.value;
    }
    
    let principal = FormatUtil.parseToNumber(input.initialPrincipal);
    let contrib = FormatUtil.parseToNumber(input.monthlyContribution);
    let expenses = FormatUtil.parseToNumber(input.monthlyExpenses);
    let inflate = FormatUtil.parseToNumber(input.inflationRate);
    let rate = FormatUtil.parseToNumber(input.investmentRate);
    let swr = FormatUtil.parseToNumber(input.safeWithdrawRate);
    let age = FormatUtil.parseToNumber(input.currentAge);

    // reset retirement age
    this.retireAge = -1;

    this.barChartData.labels = this.lineChartData.labels 
      = this.calcLabels(input.currentAge as number);  
  
    this.barChartData.datasets = this.lineChartData.datasets 
      = this.calcResultsets(principal, contrib, expenses, inflate, rate, swr, age, input.viewMode);

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

  calcResultsets(principal: number, contrib: number, expense: number, inflationRate: number, 
    investmentRate: number, swr: number, age: number, viewmode?: string): any {

      let balances: number[] = [];
      let incomes: number[] = [];
      let contributions: number[] = [];
      let expenses: number[] = [];
      let balance: number = principal;
      let totalContribs: number = principal;
      let growth: number;
      
      const calcRetireIncome = (balance: number): number => {
        return balance * swr / 100;
      };

      const calcFireNumber = (expensePerYear: number): number => {
        return expensePerYear * (1 / swr * 100);
      };
 
      const calcGrowth = (balance: number, compoundRate: number): number => {
        return balance * compoundRate / 100;
      };

      const processResults = (years: number): void => {
        this.retireAge = age + years;
        this.retireBalance = FormatUtil.formatNumber(balance, 0);
        this.retireIncome = FormatUtil.formatNumber(calcRetireIncome(balance), 0);
        this.monthlyRetireIncome = FormatUtil.formatNumber(calcRetireIncome(balance) / 12, 0);
      };

      let contribPerYear = contrib * 12;
      let expensePerYear = expense * 12;
      let targetPrincipal = calcFireNumber(expensePerYear);
      let potentialIncome: number = calcRetireIncome(principal);
   
      for (let i = 0; i <= 80; i++) {
        if (i == 0) {
          balances.push(balance);
          incomes.push(potentialIncome);
          contributions.push(totalContribs);
          expenses.push(expensePerYear);  
          
          if (balance > targetPrincipal) {
            processResults(i);
            this.retireAge = -2;
            this.maxX = i;
            break;
          }
        }
        else {
          growth = calcGrowth(balance, investmentRate);
          contribPerYear += calcGrowth(contribPerYear, inflationRate);
          expensePerYear += calcGrowth(expensePerYear, inflationRate);
          balance += growth + contribPerYear;    
          potentialIncome = calcRetireIncome(balance);
 
          totalContribs += contribPerYear; 
          
          balances.push(balance);
          incomes.push(potentialIncome);
          contributions.push(totalContribs);
          expenses.push(expensePerYear);     

          if (this.retireAge == -1 && potentialIncome >= expensePerYear ) {
            processResults(i);
            this.maxX = i;
            break;
          }
          targetPrincipal = calcFireNumber(expensePerYear)
        }
      }

      this.futureBalance = FormatUtil.formatNumber(balance);

      if (balance < 0 || principal < 0) {
        this.minY = balance < principal ? balance : principal;
      }
      else {
        this.minY = 0;
      }

      if (!this.showAsset) {
        return [{
          data: incomes,
          label: "Income"
        },{
          data: expenses,
          label: "Expenses"
        }];
      }
      else {
        return [{
          data: balances,
          label: "Balance"
        },{
          data: contributions,
          label: "Contributions"
        }];
      }
    }
  
  toggleChart() { 
      this.showAsset = !this.showAsset ;
      this.onChange();
    }

  generateAndShowTable() {
    
    this.tableDataRows = [];
    this.showTable = !this.showTable ;

    if (!this.showTable) return;

    if (!this.showAsset) {
      for(let i=0; i < this.lineChartData.labels!.length; i++) {
        this.tableDataRows.push(new TableDataRow(
          this.lineChartData.labels![i] as string,
          FormatUtil.formatNumber(this.lineChartData.datasets[0].data[i] as number),
          FormatUtil.formatNumber(this.lineChartData.datasets[1].data[i] as number),
        ))
      }
    }
    else {
      for(let i=0; i < this.barChartData.labels!.length; i++) {
        this.tableDataRows.push(new TableDataRow(
          this.barChartData.labels![i] as string,
          FormatUtil.formatNumber(this.barChartData.datasets[0].data[i] as number),
          FormatUtil.formatNumber(this.barChartData.datasets[1].data[i] as number),
        ))
      }     
    }
  }
}