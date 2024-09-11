<?php

namespace VolhovPhp\Integrator\Action;

use PhpParser\Node;
use PhpParser\NodeTraverser;
use PhpParser\NodeVisitorAbstract;
use PhpParser\ParserFactory;

class NameSpaceRegistration extends NodeVisitorAbstract
{
    private string $namespace;
    private string $targetFile;

    public function __construct(string $targetFile, string $namespace)
    {
        $this->namespace = $namespace;
        $this->targetFile = $targetFile;
    }

    /**
     * Method called when traversing each AST node.
     */
    public function enterNode(Node $node)
    {
        if ($this->isCoreNamespacesAssignment($node)) {
            $this->addNamespaceToCoreNamespaces($node->expr);
        }
    }

    /**
     * Checks if the node is an assignment for $config[KernelConstants::CORE_NAMESPACES].
     */
    private function isCoreNamespacesAssignment(Node $node): bool
    {
        return $node instanceof Node\Expr\Assign
            && $node->var instanceof Node\Expr\ArrayDimFetch
            && $node->var->dim instanceof Node\Expr\ClassConstFetch
            && $node->var->dim->name->toString() === 'CORE_NAMESPACES'
            && $node->var->var->name === 'config';
    }

    /**
     * Adds the namespace to the $config[KernelConstants::CORE_NAMESPACES] array if it doesn't already exist.
     */
    private function addNamespaceToCoreNamespaces(Node\Expr\Array_ $array): void
    {
        if ($this->namespaceExistsInArray($array)) {
            return; // Namespace already exists
        }

        // Add the new namespace
        $array->items[] = new Node\Expr\ArrayItem(new Node\Scalar\String_($this->namespace));
    }

    /**
     * Checks if the namespace already exists in the $config[KernelConstants::CORE_NAMESPACES] array.
     */
    private function namespaceExistsInArray(Node\Expr\Array_ $array): bool
    {
        foreach ($array->items as $item) {
            if ($item->value instanceof Node\Scalar\String_ && $item->value->value === $this->namespace) {
                return true;
            }
        }

        return false;
    }

    /**
     * Main method to process the file, add the namespace, and save the changes.
     */
    public function process(): void
    {
        $parser = (new ParserFactory())->createForHostVersion();
        $code = file_get_contents($this->targetFile);
        $stmts = $parser->parse($code);
        $oldTokens = $parser->getTokens();

        // Traverse the AST with a visitor to make changes
        $traverser = new NodeTraverser();
        $traverser->addVisitor($this);
        $newStmts = $traverser->traverse($stmts);

        // Format and save the modified code
        $this->saveModifiedCode($newStmts, $stmts, $oldTokens);
    }

    /**
     * Saves the modified code back to the file.
     */
    private function saveModifiedCode(array $newStmts, array $stmts, array $oldTokens): void
    {
        $prettyPrinter = new \PhpParser\PrettyPrinter\Standard();
        $modifiedCode = $prettyPrinter->printFormatPreserving($newStmts, $stmts, $oldTokens);
        file_put_contents($this->targetFile, $modifiedCode);
    }
}