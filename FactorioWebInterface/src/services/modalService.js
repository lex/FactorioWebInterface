import { CloseBaseViewModel } from "../utils/CloseBaseViewModel";
import { Observable } from "../utils/observable";
import { ModalBackground } from "../components/modalBackground";
import { EventListener } from "../utils/eventListener";
import { VirtualComponent } from "../components/virtualComponent";
import { Modal } from "../components/modal";
export class ModalService {
    constructor(viewLocator) {
        this._viewLocator = viewLocator;
    }
    showViewModel(viewModel) {
        let view = this._viewLocator.getFromViewModel(viewModel.constructor, viewModel);
        if (view == null) {
            return Promise.reject('Can not find view for the viewModel, register the viewModel with the ViewLocator.');
        }
        return new Promise(resolve => {
            let subscription;
            let backgroundSubscription;
            let closeButtonSubscription;
            let modalBackground = new ModalBackground();
            function close() {
                Observable.unSubscribe(subscription);
                Observable.unSubscribe(backgroundSubscription);
                Observable.unSubscribe(closeButtonSubscription);
                modalBackground.remove();
                resolve();
            }
            backgroundSubscription = EventListener.onClick(modalBackground, (event) => {
                if (event.target !== modalBackground) {
                    return;
                }
                event.stopPropagation();
                close();
            });
            document.body.append(modalBackground);
            if (viewModel instanceof CloseBaseViewModel) {
                subscription = viewModel.closeObservable.subscribe(close);
            }
            let viewNode;
            if (view instanceof VirtualComponent) {
                viewNode = view.root;
            }
            else if (view instanceof Node || typeof (view) === 'string') {
                viewNode = view;
            }
            if (viewNode instanceof Modal) {
                closeButtonSubscription = viewNode.onClose((event) => {
                    event.stopPropagation();
                    close();
                });
            }
            modalBackground.append(viewNode);
        });
    }
}
//# sourceMappingURL=modalService.js.map