// require VS Code later
/*
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Your extension "custom-tooltips" is now active!');

    // Register the Hover Provider for your custom language
    let hoverProvider = vscode.languages.registerHoverProvider('yourCustomLanguageId', {
        provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
            
            // Get the word at the current cursor position
            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);

            // Check if the hovered word matches a specific condition
            if (word === 'customKeyword') {
                // Return a new Hover object with the custom tooltip content
                const tooltipContent = new vscode.MarkdownString(`**Custom Tooltip:** This is the description for \`${word}\`. You can use Markdown here.`);
                return new vscode.Hover(tooltipContent, range);
            }

            // If no specific tooltip is needed, return undefined
            return undefined;
        }
    });

    // Add the provider to the extension's subscriptions to be disposed of when the extension is deactivated
    context.subscriptions.push(hoverProvider);
}
// This method is called when your extension is deactivated
export function deactivate() {}

*/

class DocAttrib {
    constructor(name, pattern) {
        this.name = name;
        this.pattern = pattern;
    }
    gen() {
        return `#${this.name} ${this.pattern}`;
    }
}
const patterns = [
    new DocAttrib("arg", "[type] [id][o:[eqls][any]]")
];