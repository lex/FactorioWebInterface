import { IDocumentService } from "./iDocumentService";

export class DocumentService implements IDocumentService {
    createForm(): HTMLFormElement {
        return document.createElement('form');
    }

    createInput(): HTMLInputElement {
        return document.createElement('input');
    }
}