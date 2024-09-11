<?php

require __DIR__ . '/../vendor/autoload.php';

use VolhovPhp\Integrator\Action\NameSpaceRegistration;
use VolhovPhp\Integrator\Action\PluginRegistration;
use Symfony\Component\Yaml\Yaml;

$options = getopt("t:");
$integrationConfig = [];
if (isset($options['t'])) {
    $targetPath = implode(DIRECTORY_SEPARATOR, array($options['t'], '.integration.yml'));
    if (!file_exists($targetPath)) {
        echo "Target module ${$targetPath} does not have integration configuration. So skipped." . PHP_EOL;
        exit(0);
    }
    $integrationConfig = Yaml::parseFile($targetPath);
} else {
    echo "Target module absolute path (-t) must be provided." . PHP_EOL;
    exit(1);
}

class Integrator {
    private $handlerMapper = [
        'NameSpaceRegistration' => NameSpaceRegistration::class,
        'PluginRegistration' => PluginRegistration::class,
    ];

    public function process(array $integrationConfig): void
    {
        foreach ($integrationConfig as $handlerConfig) {
            if (is_array($handlerConfig) && !array_key_exists('handler', $handlerConfig)) {
                 $this->process($handlerConfig);
            } elseif (array_key_exists($handlerConfig['handler'], $this->handlerMapper)) {
                (new $this->handlerMapper[$handlerConfig['handler']](...$handlerConfig['handlerArguments']))->process();
            }
        }
    }


    public function processConfigItem(array $integrationConfig): void
    {

    }
}

(new Integrator())->process($integrationConfig);
