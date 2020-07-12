import { Nav } from "../shared/nav";
export class NavService {
    constructor(hiddenInputservice) {
        this.hiddenInputservice = hiddenInputservice;
    }
    buildNav(activePage) {
        let username = this.hiddenInputservice.getValue('__username');
        return new Nav(activePage, username);
    }
}
//# sourceMappingURL=navService.js.map