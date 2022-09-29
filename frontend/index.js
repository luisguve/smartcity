import 'regenerator-runtime/runtime';
import { Wallet } from './near-wallet';
import { SmartCity } from './near-interface';

// When creating the wallet you can optionally ask to create an access key
// Having the key enables to call non-payable methods without interrupting the user to sign
const wallet = new Wallet({ createAccessKeyFor: process.env.CONTRACT_NAME })

// Abstract the logic of interacting with the contract to simplify your flow
const smartCity = new SmartCity({ contractId: process.env.CONTRACT_NAME, walletToUse: wallet });

// Setup on page load
window.onload = async () => {
  let isSignedIn = await wallet.startUp();

  if (isSignedIn) {
    signedInFlow();
  } else {
    signedOutFlow();
  }

  fetchEnergyGenerators();
};

// Button clicks
document.querySelector('#sign-in-button').onclick = () => { wallet.signIn(); };
document.querySelector('#sign-out-button').onclick = () => { wallet.signOut(); };

// Take the new greeting and send it to the contract
async function doUserAction(event) {
  event.preventDefault();
  const { greeting } = event.target.elements;

  document.querySelector('#signed-in-flow main')
    .classList.add('please-wait');

  await helloNEAR.setGreeting(greeting.value);

  // ===== Fetch the data from the blockchain =====
  await fetchGreeting();
  document.querySelector('#signed-in-flow main')
    .classList.remove('please-wait');
}

function generateTable(table, data) {
  for (let rowDataArr of data) {
    const rowData = rowDataArr[1];
    const element = {};
    element.accountId = rowData.accountId;
    element.farms = rowData.farms.length;
    element.totalPowerRate = rowData.totalPowerRate;
    element.lastWithdrawal = new Date(rowData.lastWithdrawal * 1000).toLocaleString();

    const diffSeconds = Math.floor(Date.now() / 1000) - rowData.lastWithdrawal;
    const hours = Math.floor(diffSeconds / 3600);

    element.KWhGenerated = hours * rowData.totalPowerRate;

    let row = table.insertRow();
    for (key in element) {
      let cell = row.insertCell();
      let text = document.createTextNode(element[key]);
      cell.appendChild(text);
    }
  }
}

function generateTableHead(table, keys) {
  const thead = table.createTHead();
  const row = thead.insertRow();
  for (let key of keys) {
    let th = document.createElement("th");
    let text = document.createTextNode(key);
    th.appendChild(text);
    row.appendChild(th);
  }
}

// Get Solar Farms and display them in a table
async function fetchEnergyGenerators() {
  const data = await smartCity.getEnergyGenerators();

  document.querySelectorAll('[data-behavior="energy-generators-table-container"]').forEach(el => {
    if (!data.length) {
      el.querySelector('[data-behavior="heading"]').innerText = "There are still no farms";
    } else {

      const totalPowerRate = data.reduce((total, [, account]) => total + account.totalPowerRate, 0);
      const solarFarmsCount = data.reduce((total, [, account]) => total + account.farms.length, 0);

      el.querySelector('[data-behavior="heading"]').innerText = 
      `${solarFarmsCount} solar ${(solarFarmsCount > 1) ? "farms are" : "farm is"} producing ${totalPowerRate} KWh`;

      const table = el.querySelector('[data-behavior="energy-generators"]');
      if (!table) {
        console.error("No such element: table");
        alert("Error. Check console.")
        return;
      }

      generateTable(table, data);
      const headerKeys = ["Account","Farms","Total Power Rate", "Last withdrawal", "KWh generated"];
      generateTableHead(table, headerKeys)
    }
  });
}

// Display the signed-out-flow container
function signedOutFlow() {
  document.querySelector('#signed-in-flow').style.display = 'none';
  document.querySelector('#signed-out-flow').style.display = 'block';
}

// Displaying the signed in flow container and fill in account-specific data
function signedInFlow() {
  document.querySelector('#signed-out-flow').style.display = 'none';
  document.querySelector('#signed-in-flow').style.display = 'block';
  document.querySelectorAll('[data-behavior=account-id]').forEach(el => {
    el.innerText = wallet.accountId;
  });
}
