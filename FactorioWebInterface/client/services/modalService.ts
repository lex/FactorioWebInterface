import { ViewLocator } from "./viewLocator";
import { IClose } from "../utils/closeBaseViewModel";
import { Observable } from "../utils/observable";
import { ModalBackground } from "../components/modalBackground";
import { EventListener } from "../utils/eventListener";
import { VirtualComponent } from "../components/virtualComponent";
import { Modal } from "../components/modal";
import { IModalService } from "./iModalService";
import { BaseElement } from "../components/baseElement";

export class ModalService implements IModalService {
    private _viewLocator: ViewLocator;

    constructor(viewLocator: ViewLocator) {
        this._viewLocator = viewLocator;
    }

    showViewModel(viewModel: Object): Promise<void> {
        let view = this._viewLocator.getFromViewModel(viewModel.constructor, viewModel)

        if (view == null) {
            return Promise.reject('Can not find view for the viewModel, register the viewModel with the ViewLocator.');
        }

        return new Promise(resolve => {
            let subscription: () => void;
            let backgroundSubscription: () => void;
            let closeButtonSubscription: () => void;

            let modalBackground = new ModalBackground();
            let background = document.createElement('div');
            background.classList.add('background');

            function close() {
                Observable.unSubscribe(subscription);
                Observable.unSubscribe(backgroundSubscription);
                Observable.unSubscribe(closeButtonSubscription);
                modalBackground.remove();
                resolve();
            }

            backgroundSubscription = EventListener.onClick(background, (event: MouseEvent) => {
                //if (event.target !== modalBackground) {
                //    return;
                //}

                event.stopPropagation();
                close()
            });

            document.body.append(modalBackground);

            if (IClose.isType(viewModel)) {
                subscription = viewModel.closeObservable.subscribe(close);
            }

            let viewNode: string | Node;

            if (view instanceof VirtualComponent) {
                viewNode = view.root;
            } else if (view instanceof Node || typeof (view) === 'string') {
                viewNode = view;
            }

            if (viewNode instanceof Modal) {
                closeButtonSubscription = viewNode.onClose((event: MouseEvent) => {
                    event.stopPropagation();
                    close()
                });
            }

            modalBackground.append(background, viewNode)
        });
    }
}
