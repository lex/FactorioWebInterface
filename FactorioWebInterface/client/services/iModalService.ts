export abstract class IModalService {
    abstract showViewModel(viewModel: Object): Promise<void>;
}
