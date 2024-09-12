# GeniX

## Overview

Welcome to GeniX – the ultimate companion for developers working with Spryker Commerce OS.
This powerful and interactive solution is designed to optimize and accelerate the module development process, allowing you to focus on delivering high-quality results for your clients.

With GeniX, you can effortlessly scaffold new PHP modules, generate code for plugins, manage multiple projects, and integrate your modules seamlessly into local Spryker environments.
All of this is managed through a streamlined, intuitive terminal interface that enhances your workflow and productivity.

GeniX empowers you by simplifying complex tasks, making the coding process faster, smoother, and more efficient, enabling you to meet deadlines with ease while maintaining the highest standards of quality.

## Key Features

* Interactive Terminal: Our Node.js-powered CLI guides you through the process of creating a new module by asking relevant questions and providing necessary information.
* Module Scaffolding: Automatically generate the structure of a new PHP module, including all essential service files and Spryker-related configuration files.
* Plugin Code Generation: Easily create plugin classes with minimal effort. Let the generator handle the boilerplate code while you focus on the logic.
* GitHub Integration: Create a new repository on GitHub and push your newly created module directly from the terminal.
* Module Integration: Seamlessly integrate the new module into your existing Spryker project, ensuring a smooth and efficient workflow.
* Project Management: Manage multiple Spryker projects connected to the tool with ease. Switch between projects effortlessly, and keep your work organized.
* Security: Tool configuration is encrypted and accessible only to you, secured by a password that you can set according to your preferences.

## Getting Started

### Prerequisites

* Node.js (version v20 or higher)
* NPM (version 10 or higher)
* GitHub Account with access to create repositories
* Spryker Commerce OS installed on your local environment

### Installation

Clone the repository and install the necessary dependencies:

    git clone https://github.com/spryker-community/genix.git

Switch to the project folder:

    cd genix


Create .env file based on .env_template and defined path to the projects directory on your host machine. 


Start docker container:

    docker-compose run genix


### Usage

To start the interactive terminal:

    genix

You can follow the prompts to initialize projects, generate a new module, create plugins, and integrate with your Spryker project.

## Contributing

We welcome contributions from the community! Please submit your pull requests, and we’ll review them as soon as possible.
For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License
