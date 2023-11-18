import * as vscode from 'vscode';
import * as childProcess from 'child_process';

class TestRunner {
    private extensionPath: string;

    constructor(extensionPath: string) {
        this.extensionPath = extensionPath;
    }

    runTests() {
        const workspaceRoot = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
        const env = Object.create(process.env);
        env.ERL_LIBS = `${this.extensionPath}/src/exunit_json_formatter/lib/`;

        const child = childProcess.spawn('elixir', ['-pa', env.ERL_LIBS, '-S', 'mix', 'test', '--formatter', 'ExUnitJsonFormatter'], { cwd: workspaceRoot, env: env });

        child.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        child.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        child.on('error', (error) => {
            console.error(`exec error: ${error}`);
        });
    }
}

class TestController {
    private testController: vscode.TestController;
    private testItems: vscode.TestItem[] = [];
    private testRunner: TestRunner;

    constructor(extensionPath: string) {
        this.testRunner = new TestRunner(extensionPath);
        this.testController = vscode.tests.createTestController('testController', 'Test Controller');

        this.testController.createRunProfile('Run Tests', vscode.TestRunProfileKind.Run, (request, token) => {
            const run = this.testController.createTestRun(request);
            this.testRunner.runTests(); // Add this line to run the tests when the Run Tests profile is executed
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
        this.testRunner.runTests();
    }

    dispose() {
        this.testController.dispose();
    }
}

export function activate(context: vscode.ExtensionContext) {
    const testController = new TestController(context.extensionPath);

    let disposable = vscode.commands.registerCommand('extension.runTests', () => {
        testController.runTests();
    });

    context.subscriptions.push(testController);
}

export function deactivate() {
    // This will be automatically called when the extension is deactivated
}