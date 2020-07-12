import "./nav.ts.less";
import { BaseElement } from "../components/baseElement";

export class Nav extends BaseElement {
    static readonly pageNames = {
        servers: 'Servers',
        bans: 'Bans',
        admins: 'Admins',
        scenarioData: 'Scenario Data',
        mods: 'Mods',
        account: 'Account',
        signOut: 'Sign Out'
    };

    private static readonly leftPages = [
        { name: Nav.pageNames.servers, url: '/admin/servers' },
        { name: Nav.pageNames.bans, url: '/admin/bans' },
        { name: Nav.pageNames.admins, url: '/admin/admins' },
        { name: Nav.pageNames.scenarioData, url: '/admin/scenarioData' },
        { name: Nav.pageNames.mods, url: '/admin/mods' },
    ];

    private static readonly rightPages = [
        { name: Nav.pageNames.account, url: '/admin/account' },
        { name: Nav.pageNames.signOut, url: '/admin/signout' }
    ];

    constructor(activePage?: string, username?: string) {
        super();

        let left = document.createElement('div');
        left.classList.add('nav-left');

        for (let page of Nav.leftPages) {
            let link = this.makeLink(page.name, page.url, activePage === page.name);
            left.append(link);
        }

        let right = document.createElement('div');
        right.classList.add('nav-right');

        for (let page of Nav.rightPages) {
            let name = page.name;
            if (name === Nav.pageNames.account && username) {
                name = username;
            }

            let link = this.makeLink(name, page.url, activePage === page.name);
            right.append(link);
        }

        this.append(this.makeHome(), this.makeToggle(), left, right);
    }

    private makeToggle() {
        let toggle = document.createElement('div');
        toggle.onclick = () => this.classList.toggle('active');
        toggle.classList.add('nav-toggle');
        toggle.append(document.createElement('span'), document.createElement('span'), document.createElement('span'));

        return toggle;
    }

    private makeHome() {
        let link = document.createElement('a');
        link.href = '/';
        link.classList.add('nav-home');

        let image = document.createElement('img');
        image.src = '/favicon.ico';
        link.append(image);

        return link;
    }

    private makeLink(name: string, url: string, active: boolean): HTMLAnchorElement {
        let link = document.createElement('a');
        link.href = url;
        link.textContent = name;
        link.classList.toggle('active', active);
        return link;
    }
}

customElements.define('a-nav', Nav);