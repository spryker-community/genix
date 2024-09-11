<?php

namespace VolhovPhp\Integrator\Formatter;

use PhpParser\PrettyPrinter\Standard;

class CustomPrettyPrinter extends Standard
{
    protected function pExpr_Array(\PhpParser\Node\Expr\Array_ $node): string
    {
        $syntax = $node->getAttribute('kind',
            $this->shortArraySyntax ? \PhpParser\Node\Expr\Array_::KIND_SHORT : \PhpParser\Node\Expr\Array_::KIND_LONG);
        if ($syntax === \PhpParser\Node\Expr\Array_::KIND_SHORT) {
            return "[" . $this->pCommaSeparatedMultiline($node->items, true) . "\n]";
        }

        return "array(" . $this->pCommaSeparatedMultiline($node->items, true) . ")";
    }
}