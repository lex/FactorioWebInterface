export abstract class ModalServiceBase {
    abstract showViewModel(viewModel: Object): Promise<void>;
}
