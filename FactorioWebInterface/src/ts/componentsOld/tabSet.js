import { StackPanel } from "./stackPanel";
import { TextBlock } from "./textBlock";
import { ContentContainer, Container } from "./container";
export class TabSet extends Container {
    constructor(tabs = []) {
        super();
        this._tabs = tabs;
        this._headers = new StackPanel({ direction: StackPanel.direction.row });
        this._body = new ContentContainer();
        this._main = new StackPanel({
            direction: StackPanel.direction.column,
            children: [this._headers, this._body]
        });
        for (let i = 0; i < tabs.length; i++) {
            let tab = tabs[i];
            let tabHeader = TabSet.getTabHeader(tab.header);
            this._headers.addChild(tabHeader);
            let index = i;
            tabHeader.onClick(() => {
                this.setTabIndex(index);
            });
        }
        this.setTabIndex(0);
    }
    get root() {
        return this._main.root;
    }
    setTabIndex(index) {
        let tab = this._tabs[index];
        if (!tab) {
            return;
        }
        this._body.content = tab.body;
    }
    notifyRootChanged(component, oldRoot) {
        throw new Error("Method not implemented.");
    }
    static getTabHeader(header) {
        if (typeof header === 'string') {
            return new TextBlock(header);
        }
        return header;
    }
}
//# sourceMappingURL=tabSet.js.map