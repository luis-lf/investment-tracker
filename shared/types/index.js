"use strict";
// Shared types between frontend and backend
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentType = exports.Country = exports.InvestmentStatus = void 0;
var InvestmentStatus;
(function (InvestmentStatus) {
    InvestmentStatus["ACTIVE"] = "ACTIVE";
    InvestmentStatus["DONE"] = "DONE";
    InvestmentStatus["SOLD"] = "SOLD";
    InvestmentStatus["TRANSFERRED"] = "TRANSFERRED";
})(InvestmentStatus || (exports.InvestmentStatus = InvestmentStatus = {}));
var Country;
(function (Country) {
    Country["BR"] = "BR";
    Country["US"] = "US";
})(Country || (exports.Country = Country = {}));
var InvestmentType;
(function (InvestmentType) {
    InvestmentType["RENDA_FIXA_IPCA"] = "RENDA_FIXA_IPCA";
    InvestmentType["RENDA_FIXA_POS"] = "RENDA_FIXA_POS";
    InvestmentType["RENDA_FIXA_PRE"] = "RENDA_FIXA_PRE";
    InvestmentType["STOCKS"] = "STOCKS";
    InvestmentType["FUNDS"] = "FUNDS";
    InvestmentType["MONEY_MARKET"] = "MONEY_MARKET";
    InvestmentType["BANK_ACCOUNT"] = "BANK_ACCOUNT";
    InvestmentType["BROKERAGE"] = "BROKERAGE";
    InvestmentType["CDB"] = "CDB";
    InvestmentType["LCI"] = "LCI";
    InvestmentType["LCA"] = "LCA";
    InvestmentType["TREASURY"] = "TREASURY";
    InvestmentType["OTHER"] = "OTHER";
})(InvestmentType || (exports.InvestmentType = InvestmentType = {}));
//# sourceMappingURL=index.js.map