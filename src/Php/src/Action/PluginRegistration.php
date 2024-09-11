<?php

namespace VolhovPhp\Integrator\Action;

use PhpParser\Node;
use PhpParser\NodeTraverser;
use PhpParser\NodeVisitorAbstract;
use PhpParser\ParserFactory;
use PhpParser\PrettyPrinter\Standard;
use PhpParser\Node\Expr\New_;
use PhpParser\Node\Name;
use PhpParser\Node\Stmt\ClassMethod;
use PhpParser\Node\Stmt\Class_;
use PhpParser\Node\Stmt\Return_;
use PhpParser\Node\Stmt\Expression;
use PhpParser\Node\Expr\Array_;
use PhpParser\Node\Expr\ArrayItem;
use PhpParser\Node\Stmt\Use_;
use PhpParser\Node\Stmt\UseUse;

class PluginRegistration extends NodeVisitorAbstract
{
    private string $targetMethod;
    private string $pluginName;
    private string $pluginNamespace;
    private string $whereToRegister;
    private string $vendorRegistrator;

    public function __construct(string $whereToRegister, string $vendorRegistrator, string $targetMethod, string $pluginNamespace, string $pluginName)
    {
        $this->targetMethod = $targetMethod;
        $this->pluginName = $pluginName;
        $this->pluginNamespace = $pluginNamespace;
        $this->whereToRegister = $whereToRegister;
        $this->vendorRegistrator = $vendorRegistrator;
    }

    public function enterNode(Node $node)
    {
        if ($node instanceof Node\Stmt\Namespace_) {
            $this->addUseStatement($node);

            foreach ($node->stmts as $namespaceStmt) {
                if ($namespaceStmt instanceof Class_) {
                    $this->processClass($namespaceStmt);
                }
            }
        } elseif ($node instanceof Class_) {
            $this->processClass($node);
        }
    }

    private function processClass(Class_ $classNode)
    {
        foreach ($classNode->stmts as $classStmt) {
            if ($classStmt instanceof ClassMethod && $classStmt->name->toString() === $this->targetMethod) {
                $this->updateMethodWithPlugin($classStmt);
            }
        }
    }

    private function updateMethodWithPlugin(ClassMethod $method)
    {
        $returnStmt = $this->findReturnStatement($method);
        $returnExpr = $returnStmt ? $returnStmt->expr : null;

        // Check if the return expression is an array and already contains the plugin
        if ($returnExpr instanceof Array_) {
            if (!$this->arrayContainsPlugin($returnExpr)) {
                $this->addPluginToArray($returnExpr);
            }
        } elseif (!$returnStmt) {
            $this->createReturnWithPlugin($method);
        }
    }

    private function findReturnStatement(ClassMethod $method): ?Return_
    {
        foreach ($method->stmts as $stmt) {
            if ($stmt instanceof Return_) {
                return $stmt;
            }
        }
        return null;
    }

    private function arrayContainsPlugin(Array_ $arrayExpr): bool
    {
        foreach ($arrayExpr->items as $item) {
            if ($item->value instanceof New_ && $item->value->class->toString() === $this->pluginName) {
                return true;
            }
        }
        return false;
    }

    private function addPluginToArray(Array_ $arrayExpr): void
    {
        $arrayExpr->items[] = new ArrayItem(new New_(new Name($this->pluginName)));
        echo "Plugin {$this->pluginName} successfully added to method {$this->targetMethod}.\n";
    }

    private function createReturnWithPlugin(ClassMethod $method): void
    {
        $pluginArray = new Array_([
            new ArrayItem(new New_(new Name($this->pluginName))),
        ]);
        $method->stmts[] = new Return_($pluginArray);
        echo "New return statement with plugin {$this->pluginName} added to method {$this->targetMethod}.\n";
    }

    private function addUseStatement(Node\Stmt\Namespace_ $namespaceNode)
    {
        if (!$this->useStatementExists($namespaceNode)) {
            $useStatement = new Use_([new UseUse(new Name($this->pluginNamespace))]);
            array_unshift($namespaceNode->stmts, $useStatement);  // Add use at the beginning
            echo "Use statement for {$this->pluginNamespace} added.\n";
        }
    }

    private function useStatementExists(Node\Stmt\Namespace_ $namespaceNode): bool
    {
        foreach ($namespaceNode->stmts as $stmt) {
            if ($stmt instanceof Use_) {
                foreach ($stmt->uses as $use) {
                    if ($use->name->toString() === $this->pluginNamespace) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public function process():void
    {
        $parser = (new ParserFactory())->createForHostVersion();
        $code = file_get_contents($this->whereToRegister);
        $stmts = $parser->parse($code);
        $oldTokens = $parser->getTokens();

        $traverser = new NodeTraverser();
        $traverser->addVisitor($this);

        $newStmts = $traverser->traverse($stmts);

        if (!$this->checkIfMethodExists($newStmts, $this->targetMethod)) {
            $this->copyMethodFromVendor($newStmts);
        }

        $prettyPrinter = new Standard();
        $modifiedCode = $prettyPrinter->printFormatPreserving($newStmts, $stmts, $oldTokens);

        file_put_contents($this->whereToRegister, $modifiedCode);
    }

    private function checkIfMethodExists(array $stmts, string $methodName): bool
    {
        foreach ($stmts as $stmt) {
            if ($stmt instanceof Class_) {
                foreach ($stmt->getMethods() as $method) {
                    if ($method->name->toString() === $methodName) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private function copyMethodFromVendor(array &$newStmts)
    {
        $parser = (new ParserFactory())->createForHostVersion();
        $vendorCode = file_get_contents($this->vendorRegistrator);

        if ($vendorCode === false) {
            echo "Unable to read vendor file: {$this->vendorRegistrator}\n";
            return;
        }

        $vendorStmts = $parser->parse($vendorCode);

        if ($vendorStmts === null) {
            echo "Unable to parse vendor file: {$this->vendorRegistrator}\n";
            return;
        }

        $vendorClass = $this->findClassInStmts($vendorStmts);
        if (!$vendorClass) {
            echo "Class not found in vendor file {$this->vendorRegistrator}\n";
            return;
        }

        $vendorMethod = $this->findMethodInClass($vendorClass, $this->targetMethod);
        if (!$vendorMethod) {
            echo "Method {$this->targetMethod} not found in vendor class.\n";
            return;
        }

        $targetClass = $this->findClassInStmts($newStmts);
        if ($targetClass && !$this->checkIfMethodExists([$targetClass], $this->targetMethod)) {
            $clonedMethod = clone $vendorMethod;
            $targetClass->stmts[] = $clonedMethod;

            echo "Method {$this->targetMethod} successfully copied from vendor class to target class.\n";
            $this->updateMethodWithPlugin($clonedMethod);
        } else {
            echo "Method {$this->targetMethod} already exists in the target class.\n";
        }
    }

    private function findClassInStmts(array $stmts): ?Class_
    {
        foreach ($stmts as $stmt) {
            if ($stmt instanceof Node\Stmt\Namespace_) {
                foreach ($stmt->stmts as $namespaceStmt) {
                    if ($namespaceStmt instanceof Class_) {
                        return $namespaceStmt;
                    }
                }
            } elseif ($stmt instanceof Class_) {
                return $stmt;
            }
        }
        return null;
    }

    private function findMethodInClass(Class_ $classNode, string $methodName): ?ClassMethod
    {
        foreach ($classNode->stmts as $classStmt) {
            if ($classStmt instanceof ClassMethod && $classStmt->name->toString() === $methodName) {
                return $classStmt;
            }
        }
        return null;
    }
}