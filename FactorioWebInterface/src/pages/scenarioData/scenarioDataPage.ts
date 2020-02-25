import "../../components/component.less";
import { MainView } from "./mainView";

let app = document.getElementById('app');
let scenarioDataPage = new MainView();
app.appendChild(scenarioDataPage.root);