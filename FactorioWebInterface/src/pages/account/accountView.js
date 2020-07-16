import { VirtualComponent } from "../../components/virtualComponent";
import { VirtualForm } from "../../components/virtualForm";
import { PasswordField } from "../../components/passwordField";
import { Field } from "../../components/field";
import { Button } from "../../components/button";
import { FlexPanel } from "../../components/flexPanel";
export class AccountView extends VirtualComponent {
    constructor(accountViewModel) {
        super();
        let root = new FlexPanel(FlexPanel.classes.vertical, FlexPanel.classes.childSpacing, 'page-container');
        this._root = root;
        let header = document.createElement('h2');
        header.textContent = 'Account';
        let usernameText = document.createElement('h4');
        usernameText.textContent = `Username: ${accountViewModel.username}`;
        let helpText = document.createElement('div');
        if (accountViewModel.hasPassword) {
            helpText.innerHTML = `<p>Change your account's password</p>`;
        }
        else {
            helpText.innerHTML =
                `<p>Create a password for your account.</p>
                 <p>This let's you sign in without Discord.</p>`;
        }
        let form = new VirtualForm(accountViewModel, [
            new PasswordField('newPassword', 'New Password'),
            new PasswordField('confirmNewPassword', 'Confirm New Password'),
            new Field(new Button(accountViewModel.submitButtonText, Button.classes.link)
                .setCommand(accountViewModel.submitCommand))
        ]);
        form.root.style.maxWidth = '480px';
        form.root.classList.add(FlexPanel.classes.spacingNone);
        root.append(header, usernameText, helpText, form.root);
        if (accountViewModel.passwordUpdated) {
            let passwordUpdatedText = document.createElement('p');
            passwordUpdatedText.textContent = 'Password Updated';
            root.append(passwordUpdatedText);
        }
        if (accountViewModel.errorUpdating) {
            let errorText = document.createElement('p');
            errorText.textContent = 'Error updating password.';
            errorText.style.color = 'red';
            root.append(errorText);
        }
    }
}
//# sourceMappingURL=accountView.js.map