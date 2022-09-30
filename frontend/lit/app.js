import {LitElement, css, html} from 'lit';

import { Wallet } from '../lib/near-wallet';
import { SmartCity } from '../lib/near-interface';

const farmsInfoMapping = {
  small: {
    panels: 80,
    powerRate: 160,
    price: 100
  },
  medium: {
    panels: 140,
    powerRate: 280,
    price: 160
  },
  big: {
    panels: 210,
    powerRate: 420,
    price: 250
  }
}

export class AppEntryPoint extends LitElement {
  static properties = {
    _isLoggedIn: {
      type: Boolean,
      state: true
    },
    _wallet: {
      state: true
    },
    _contract: {
      state: true
    },
    _energyGenerators: {
      state: true
    },
    _accountInfo: {
      state: true
    }
  };
  // Define scoped styles right with your component, in plain CSS
  // static styles = css``;

  constructor() {
    super();
    // Declare reactive properties
    this._isLoggedIn = false;
    this._wallet = new Wallet({ createAccessKeyFor: process.env.CONTRACT_NAME });
    this._contract = new SmartCity({ contractId: process.env.CONTRACT_NAME, walletToUse: this._wallet });
    this._energyGenerators = [];
    this._accountInfo = null;
  }

  connectedCallback() {
    super.connectedCallback();
    const ctx = this;

    ctx._wallet.startUp()
    .then(result => {
      ctx._isLoggedIn = result;

      if (ctx._isLoggedIn) {
        ctx.fetchUserInfo();
      }

      ctx.fetchEnergyGenerators();
    });
  }

  async fetchEnergyGenerators() {
    try {
      this._energyGenerators = await this._contract.getEnergyGenerators(); 
    } catch(err) {
      console.error("Error while getting energy generators", err);
    }
  }
  async fetchUserInfo() {
    try {
      this._accountInfo = await this._contract.getAccountInfo(); 
    } catch(err) {
      console.error("Error while getting account info", err);
    }
  }
  async buyFarm(farmSize) {
    try {
      console.log("Buying farm");
      await this._contract.buySolarFarm(farmSize, farmsInfoMapping[farmSize].price);
      console.log("Buy farm success")
    } catch(err) {
      console.error("Error while buy farm", err);
    }
  }
  async withdraw() {
    try {
      const tokensWithdrawn = await this._contract.withdraw();
    } catch(err) {
      console.error("Error while withdrawing", err);
    }
  }

  login() {
    this._wallet.signIn();
  }
  logout() {
    this._wallet.logout();
  }
  renderWithdrawButton() {
    const data = this._accountInfo;
    if (!data) {
      return null;
    }
    const diffSeconds = Math.floor(Date.now() / 1000) - data.lastWithdrawal;
    const hours = Math.floor(diffSeconds / 3600);

    const KWhGenerated = hours * data.totalPowerRate;

    if (!KWhGenerated > 0) {
      return html`<p>0 tokens to withdraw</p>`;
    }

    return html`
      <button @click="${withdraw}">Withdraw ${KWhGenerated} tokens</button>
    `;
  }
  renderRedeemButton() {
    
  }
  renderUserInfo() {
    const data = this._accountInfo;
    if (data == null) {
      return null;
    }
    const classifiedFarms = data.farms.reduce((farms, farm) => {
      farms[farm.name] = farms[farm.name].concat(farm)
      return farms;
    }, {small: [], medium: [], big: []});

    let farmsSections = [];

    for (const farmSize in classifiedFarms) {
      const farms = classifiedFarms[farmSize];
      const farmInfo = farmsInfoMapping[farmSize];
      let desc = null;
      if (farms.length > 0) {
        desc = html`
          <p>Total power rate: ${farms.length * farmInfo.powerRate} KWh</p>
        `;
      }
      const ctx = this;
      const buyFarm = () => ctx.buyFarm(farmSize);
      farmsSections.push(html`
        <article>
          <h4>${farmSize}: ${farmInfo.powerRate} KWh</h4>
          <h6>${farms.length} ${(farms.length > 1) ? "farms" : "farm"}</h6>
          ${desc}
          <strong>Price: ${farmInfo.price}</strong>
          <button @click="${buyFarm}">Buy farm</button>
        </article>
      `);
    }

    return html`
    <section data-behavior="dashboard">
      <h4>Total power rate of your farms: ${data.totalPowerRate ?? 0} KWh</h4>
      ${farmsSections}
      ${renderWithdrawButton()}
      ${renderRedeemButton()}
    </section>
    `;
  }
  renderEnergyGenerators() {
    const data = this._energyGenerators;
    let heading = html`<h3>There are still no farms</h3>`;
    let table;

    if (data.length > 0) {
      const totalPowerRate = data.reduce((total, [, account]) => total + account.totalPowerRate, 0);
      const solarFarmsCount = data.reduce((total, [, account]) => total + account.farms.length, 0);
      heading = html`<h3>${solarFarmsCount} solar ${(solarFarmsCount > 1) ? "farms are" : "farm is"} producing ${totalPowerRate} KWh</h3>`;

      const tableRows = data.map(rowDataArr => {
        const rowData = rowDataArr[1];
        const element = {};
        element.accountId = rowData.accountId;
        element.farms = rowData.farms.length;
        element.totalPowerRate = rowData.totalPowerRate;
        element.lastWithdrawal = new Date(rowData.lastWithdrawal * 1000).toLocaleString();

        const diffSeconds = Math.floor(Date.now() / 1000) - rowData.lastWithdrawal;
        const hours = Math.floor(diffSeconds / 3600);

        element.KWhGenerated = hours * rowData.totalPowerRate;

        return html`
          <tr>
            <td>${element.accountId}</td>
            <td>${element.farms}</td>
            <td>${element.totalPowerRate}</td>
            <td>${element.lastWithdrawal}</td>
            <td>${element.KWhGenerated}</td>
          </tr>
        `;
      });

      table = html`
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Farms</th>
              <th>Total Power Rate</th>
              <th>Last withdrawal</th>
              <th>KWh generated</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `;
    }
    return html`
      <section>
        ${heading}
        ${table}
      </section>
    `;
  }

  render() {

    const unauthenticatedWorkflow = html`
    <section class="signed-out-flow">
      <p style="text-align: center; margin-top: 2.5em">
        <button @click="${this._login}" id="sign-in-button">Sign in with NEAR Wallet</button>
      </p>
      ${this.renderEnergyGenerators()}
    </section>
    `;

    const authenticatedWorkflow = html`
    <section class="signed-in-flow">
      <button style="float: right" id="sign-out-button" @click="${this.logout}">
        Sign out <span>${this._wallet.accountId}</span>
      </button>
      <div>
        ${this.renderEnergyGenerators()}
      </div>
      ${this.renderUserInfo()}
    </section>
    `;

    const userWorkflow = this._isLoggedIn ? authenticatedWorkflow : unauthenticatedWorkflow;

    return html`
    <main>
      <h1>Smart city simulator: decentralized energy</h1>
      <p>Buy solar farms, produce and supply energy to the grid, get tokens</p>
      ${userWorkflow}
    </main>
    `;
  }
}

customElements.define('app-entry-point', AppEntryPoint);
