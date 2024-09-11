import { Engine, Declaration } from 'php-parser';
import * as path from 'path';
import * as fs from 'fs';
import * as ndjson from 'ndjson';
import {existsSync} from "node:fs";
import chalk from "chalk";
import {mkdirSync} from "fs";
import _ from "lodash";
import Util from "../Util";

export interface MethodParam {
    name: string;
    type: string
}

export interface MethodInfo {
    method: string;
    deprecated: boolean;
    params: MethodParam[];
    returnType: string;
}

export interface ClassInfo {
    name: string;
    namespace: string;
    deprecated: boolean;
    registrationMethod: string;
    derivedClassName: string,
    isPlugin: boolean,
    projectLevelRegistrationClass: string,
    registrationClass: string,
    module: string,
    relativePath: string,
    methods: MethodInfo[];
    uses: string[];
}

export default class PhpAnalyzer {
    private parser: Engine;
    private pathToProject: string;

    constructor(pathToProject: string) {
        this.pathToProject = pathToProject;
        this.parser = new Engine({
            parser: {
                php7: true,
                suppressErrors: true
            },
            ast: { withPositions: true },
            lexer: { all_tokens: true }
        });
    }

    public async analyzePhpFile(filePath: string): Promise<ClassInfo[]> {
        const phpCode = fs.readFileSync(filePath, 'utf8');
        const ast = this.parser.parseCode(phpCode, filePath);

        const classesAndInterfaces: ClassInfo[] = [];
        let currentNamespace = '';
        let useStatements: string[] = [];

        const extractClassInfo = (node: any): ClassInfo => {
            let derivedClassName:string = node.name.name.replace('Interface', '')
            let moduleName:string = _.upperFirst(_.camelCase(filePath.replace(/\/src.*$/, '').split(path.sep).pop() ?? ''))
            let registrationClass: string = Util.buildPath([filePath.replace(/(\/src\/[^\/]+\/[^\/]+\/[^\/]+\/).*/, '$1'), `${moduleName}DependencyProvider.php`]).replace(this.pathToProject, '')

            const classInfo: ClassInfo = {
                name: node.name.name,
                namespace: currentNamespace,
                deprecated: false,
                derivedClassName: derivedClassName,
                isPlugin: derivedClassName.includes('Plugin'),
                registrationMethod: `get${derivedClassName}s`,
                registrationClass: registrationClass,
                projectLevelRegistrationClass: Util.buildPath(['/src/Pyz', registrationClass.replace(/^.*\/src/, 'src').replace(/src\/[^\/]+\//, '')]),
                module: moduleName,
                relativePath: filePath.replace(this.pathToProject, ''),
                methods: [],
                uses: []
            };

            if (node.leadingComments) {
                classInfo.deprecated = node.leadingComments.some((comment: any) =>
                    comment.value.includes('@deprecated')
                );
            }

            if (node.body) {
                node.body.forEach((childNode: any) => {
                    if (childNode.kind === 'method' && childNode.visibility === 'public') {
                        const methodNode = childNode as any;
                        const methodInfo: MethodInfo = {
                            method: methodNode.name.name,
                            deprecated: false,
                            params: [],
                            returnType: methodNode.type ? methodNode.type.name : 'void'
                        };

                        if (methodNode.leadingComments) {
                            methodInfo.deprecated = methodNode.leadingComments.some((comment: any) =>
                                comment.value.includes('@deprecated')
                            );
                        }

                        methodNode.arguments.forEach((param: any) => {
                            const paramInfo = {
                                name: param.name.name,
                                type: param.type ? param.type.name : 'unknown'
                            };
                            methodInfo.params.push(paramInfo);
                        });

                        classInfo.methods.push(methodInfo);
                    }
                });
            }

            classInfo.uses = [...useStatements];

            return classInfo;
        };

        const traverseAst = (node: any) => {
            if (node.kind === 'namespace') {
                currentNamespace = node.name ? node.name : '';
                node.children.forEach(traverseAst);
            } else if (node.kind === 'class' || node.kind === 'interface') {
                const classInfo = extractClassInfo(node as Declaration);
                classesAndInterfaces.push(classInfo);
            } else if (node.kind === 'usegroup' || node.kind === 'use') {
                node.items.forEach((useItem: any) => {
                    useStatements.push(useItem.name);
                });
            } else if (node.kind === 'program') {
                node.children.forEach(traverseAst);
            }
        };

        traverseAst(ast);
        return classesAndInterfaces;
    }

    public async analyzeDirectory(
        dirPath: string,
        outputStream: NodeJS.WritableStream,
        keywords: string[] = []
    ): Promise<void> {
        if (!existsSync(dirPath)) {
            console.warn(chalk.yellow(`\n Target path ${dirPath} is not found. Ensure composer install was executed.`))
            return
        }
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                await this.analyzeDirectory(filePath, outputStream, keywords);
            } else if (file.endsWith('.php') && !dirPath.includes('Test')) {
                const matchesKeywords = keywords.length === 0 || keywords.some(keyword => dirPath.includes(keyword));
                // const matchesKeywords = keywords.length === 0 || keywords.some(keyword => file.includes(keyword));

                if (matchesKeywords) {
                    const classInfos = await this.analyzePhpFile(filePath);
                    classInfos?.forEach(info => {
                        outputStream.write(JSON.stringify(info) + '\n');
                    });
                }
            }
        }
    }

    public async collectModuleNames(
        dirPath: string,
        outputStream: NodeJS.WritableStream,
        keywords: string[] = []
    ): Promise<void> {
        if (!existsSync(dirPath)) {
            console.warn(chalk.yellow(`\n Target path ${dirPath} is not found. Ensure composer install was executed.`))
            return
        }
        const files = fs.readdirSync(dirPath);
        files?.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                outputStream.write(JSON.stringify({
                    module: _.upperFirst(_.camelCase(file))
                }) + '\n');
            }
        });
    }

    public async runAnalysis(paths: string[], outputFile: string, keywords: string[] = []): Promise<void> {
        this.createFolders(outputFile)
        const fileStream = fs.createWriteStream(outputFile);
        const ndjsonStream = ndjson.stringify();
        ndjsonStream.pipe(fileStream);

        for (const projectPath of paths) {
            await this.analyzeDirectory(projectPath, ndjsonStream, keywords);
        }

        ndjsonStream.end();
    }

    public async collectModules(paths: string[], outputFile: string, keywords: string[] = []): Promise<void> {
        this.createFolders(outputFile)
        const fileStream = fs.createWriteStream(outputFile);
        const ndjsonStream = ndjson.stringify();
        ndjsonStream.pipe(fileStream);

        for (const projectPath of paths) {
            await this.collectModuleNames(projectPath, ndjsonStream, keywords);
        }

        ndjsonStream.end();
    }

    private createFolders = (outputFile: string) => {
        const dir = path.dirname(outputFile);
        mkdirSync(dir, { recursive: true });
    }
}