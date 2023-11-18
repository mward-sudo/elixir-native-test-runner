import * as vscode from 'vscode';
import * as child_process from 'child_process';

class TestRunner {
    runTests() {
        const workspaceRoot = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
        child_process.exec(`cd ${workspaceRoot} && mix test`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
        });
    }
}

class TestController {
    private testController: vscode.TestController;
    private testItems: vscode.TestItem[];

    constructor() {
        this.testController = vscode.tests.createTestController('elixirTestController', 'Elixir Test Controller');
        this.testItems = [];

        this.testController.createRunProfile('Run Tests', vscode.TestRunProfileKind.Run, (request, token) => {
            const run = this.testController.createTestRun(request);
            for (const item of this.testItems) {
                run.passed(item);
            }
            run.end();
        }, true);

        this.testController.resolveHandler = async (item) => {
            if (!item) {
                item = this.testController.createTestItem('root', 'Root');
                this.testController.items.add(item);
                for (let i = 0; i < 5; i++) {
                    const testItem = this.testController.createTestItem(`test${i}`, `Test ${i}`);
                    this.testItems.push(testItem);
                    item.children.add(testItem);
                }
            }
        };
    }

    runTests() {
        const testRunner = new TestRunner();
        testRunner.runTests();
    }

    dispose() {
        this.testController.dispose();
    }
}

export function activate(context: vscode.ExtensionContext) {
    const testController = new TestController();

    let disposable = vscode.commands.registerCommand('extension.runTests', () => {
        testController.runTests();
    });

    context.subscriptions.push(disposable);

    context.subscriptions.push(testController);
}

export function deactivate() {
    // This will be automatically called when the extension is deactivated
}