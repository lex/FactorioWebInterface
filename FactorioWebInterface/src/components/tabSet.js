import "./tabSet.ts.less";
import { TabHeaders } from "./tabHeaders";
import { Tab } from "./tab";
import { ContentPresenter } from "./contentPresenter";
import { NodeHelper } from "../utils/nodeHelper";
import { EventListener } from "../utils/eventListener";
export class TabSet extends HTMLElement {
    constructor(tabsOrNode) {
        super();
        let headers;
        let tabs;
        if (!tabsOrNode) {
            headers = new TabHeaders();
        }
        else if (Array.isArray(tabsOrNode)) {
            headers = new TabHeaders(tabsOrNode);
            tabs = tabsOrNode;
        }
        else {
            headers = tabsOrNode;
        }
        this.appendChild(headers);
        this._contentPresenter = new ContentPresenter();
        this.appendChild(this._contentPresenter);
        if (!tabs) {
            tabs = NodeHelper.getByInstanceOf(headers, Tab);
        }
        for (let tab of tabs) {
            EventListener.onClick(tab, () => this.selectedTab = tab);
        }
        if (tabs.length > 0) {
            this.selectedTab = tabs[0];
        }
    }
    get selectedTab() {
        return this._selectedTab;
    }
    set selectedTab(tab) {
        if (tab === this._selectedTab) {
            return;
        }
        if (this._selectedTab) {
            this._selectedTab.removeAttribute('selected');
        }
        if (tab) {
            tab.setAttribute('selected', '');
        }
        this._selectedTab = tab;
        this._contentPresenter.setContent(tab.getContent());
    }
}
customElements.define('a-tab-set', TabSet);
//# sourceMappingURL=tabSet.js.map