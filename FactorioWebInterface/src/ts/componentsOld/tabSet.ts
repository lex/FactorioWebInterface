import { ComponentBase } from "./componentBase";
import { StackPanel } from "./stackPanel";
import { Div } from "./div";
import { Tab } from "./tab";
import { TextBlock } from "./textBlock";
import { ContentContainer, Container } from "./container";
import { BasicComponent } from "./BasicComponent";

export class TabSet extends Container {
    private _main: ComponentBase;
    private _headers: StackPanel;
    private _body: ContentContainer;
    private _tabs: Tab[];

    get root(): HTMLElement {
        return this._main.root;
    }

    constructor(tabs: Tab[] = []) {
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
            this._headers.addChild(tabHeader)

            let index = i;
            tabHeader.onClick(() => {
                this.setTabIndex(index);
            })
        }

        this.setTabIndex(0);
    }

    setTabIndex(index: number) {
        let tab = this._tabs[index];
        if (!tab) {
            return;
        }

        this._body.content = tab.body;
    }

    notifyRootChanged(component: ComponentBase, oldRoot: HTMLElement): void {
        throw new Error("Method not implemented.");
    }

    private static getTabHeader(header: BasicComponent | string): BasicComponent {
        if (typeof header === 'string') {
            return new TextBlock(header);
        }
        return header;
    }
}