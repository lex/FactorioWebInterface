import { INavService } from "./iNavService";
import { Nav } from "../shared/nav";
import { IHiddenInputService } from "./iHiddenInputService";

export class NavService implements INavService {
    constructor(private readonly hiddenInputservice: IHiddenInputService) {
    }

    buildNav(activePage: string): Nav {
        let username = this.hiddenInputservice.getValue('__username');
        return new Nav(activePage, username);
    }
}