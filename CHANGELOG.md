## [1.3.1](https://github.com/duongductrong/os-kit/compare/v1.3.0...v1.3.1) (2026-02-28)

### Release

* manual patch release ([77971a9](https://github.com/duongductrong/os-kit/commit/77971a9675fc1b8f707676e071b6e95da348f5b4))

### Features

* **release:** add manual dispatch options for release type and trigger commit ([ee333b5](https://github.com/duongductrong/os-kit/commit/ee333b5cfafed2323a679f8bdc114f9af442ff63))

## [1.3.0](https://github.com/duongductrong/os-kit/compare/v1.2.0...v1.3.0) (2026-02-28)

### Release

* **fix:** fix cicd ([c9e5a00](https://github.com/duongductrong/os-kit/commit/c9e5a00e12447108c74eeb28d3cd7be7beda9f9a))

## [1.2.0](https://github.com/duongductrong/os-kit/compare/v1.1.0...v1.2.0) (2026-02-28)

### Release

* fix build ([b4d6349](https://github.com/duongductrong/os-kit/commit/b4d634919d706c5e36a68a7b21ac79d4cc4fb2b1))

## [1.1.0](https://github.com/duongductrong/os-kit/compare/v1.0.0...v1.1.0) (2026-02-28)

### Release

* first release with CI/CD pipeline and Homebrew cask distribution ([d3cbbc4](https://github.com/duongductrong/os-kit/commit/d3cbbc4261cf22a42f6e13610f6bde0c1873cf0c))

## 1.0.0 (2026-02-28)

### Release

* add script to sync version in tauri.conf.json and Cargo.toml ([75ac08e](https://github.com/duongductrong/os-kit/commit/75ac08ee5fa3d964c8c4ad6a8dbb1da188a91ca9))

### Features

* Add an installation search bar to filter tools and sections on the installation page. ([98f01d3](https://github.com/duongductrong/os-kit/commit/98f01d3ed4c4cd8043421bc667ecdeb0d3dcd6e7))
* add Docker, OrbStack, MySQL, PostgreSQL, Redis, and Nginx installations. ([068b91f](https://github.com/duongductrong/os-kit/commit/068b91f37bbb01462c76d6d586e116e118d94efe))
* Add Section UI components and update the index page to display example settings. ([297dd01](https://github.com/duongductrong/os-kit/commit/297dd01e2fef17ecbd3dabcde5cbbcba1519f9e0))
* add size command support for installation tools and update related components ([ed5e8b3](https://github.com/duongductrong/os-kit/commit/ed5e8b3c90c80a10df8c9e21947e8dd7501cfe11))
* add system info feature with utilities for parsing system commands ([68d432b](https://github.com/duongductrong/os-kit/commit/68d432b4b41ec4eddb3e1e62d9c37ba228be1c01))
* add templates for bug fixes, feature implementations, and refactoring plans ([63455ab](https://github.com/duongductrong/os-kit/commit/63455ab97e2e47a74f4520f2f58ee6a6a0ab2716))
* add Zshrc editor component, hook, and route with file read/write and backup functionality. ([79b83ba](https://github.com/duongductrong/os-kit/commit/79b83ba873ee3c2bcc7e3e02a5738d020c7425ff))
* change icon ([fa8eda1](https://github.com/duongductrong/os-kit/commit/fa8eda12bb655b02a0bb3c2a07a629404cf0261f))
* enhance manual installation status with a tooltip for more information ([161f02e](https://github.com/duongductrong/os-kit/commit/161f02e51a85fc79c1eae377715c5babcdd6e7f6))
* enhance Zshrc editor with backup and restore functionality, and improve path parsing logic ([51e7141](https://github.com/duongductrong/os-kit/commit/51e7141395d34d7447e548f85c7e28d1a46a4916))
* Implement a new application layout with a comprehensive sidebar navigation and introduce various core UI components. ([3d4dda6](https://github.com/duongductrong/os-kit/commit/3d4dda671be53d4dbd2f157634f06fc362617244))
* Implement a new installation feature with Homebrew management, progress tracking, and dedicated UI components. ([a4b39c9](https://github.com/duongductrong/os-kit/commit/a4b39c9172911be287d952e0937d3134a15c9655))
* Implement Homebrew cask detection and dynamic action commands based on installation source ([232ceef](https://github.com/duongductrong/os-kit/commit/232ceef4384b02f5c0618414226d29044f24cb0e))
* implement real-time terminal logging for tool installation and actions, and update PostgreSQL detection commands. ([3bfa52d](https://github.com/duongductrong/os-kit/commit/3bfa52dbbf494b7c970cf600265842341de0904e))
* implement theme provider and remove projects feature ([3070f3d](https://github.com/duongductrong/os-kit/commit/3070f3df25dea7caea52cf839c856b26b71853f0))
* Implement tool version detection, upgrade, and uninstall functionality, and add NVM version listing. ([05fbe23](https://github.com/duongductrong/os-kit/commit/05fbe239490f0d89a6a6a9a1897f09c8b9f3f40d))
* implement visual editor for zshrc configuration with sections for environment variables, aliases, path entries, and sources ([d0c8c30](https://github.com/duongductrong/os-kit/commit/d0c8c306761c76fd5bfc8c4a9f0d054f2309d361))
* initialize the devkit ([b226598](https://github.com/duongductrong/os-kit/commit/b2265985793817756914501ce855bd691fccbc14))
* integrate TanStack Router for application routing and remove the root App component. ([f6948d9](https://github.com/duongductrong/os-kit/commit/f6948d99f6afe1356ebe8c377101c16a901d4484))
* Introduce a generic CLI tool detection and installation hook, updating installation data with shell commands and refactoring installation state to utilize it. ([bca98f6](https://github.com/duongductrong/os-kit/commit/bca98f66c32246b0d309fb0801cb168a040c6b65))
* **local-domains:** add Local Domains Manager with SSL certificate management and proxy configuration ([546130d](https://github.com/duongductrong/os-kit/commit/546130d03cb572bcad7b1cc17dd627a346354f92))
* Rename project from devkit to oskit across all configurations and source files. ([5b452de](https://github.com/duongductrong/os-kit/commit/5b452de91ff4e23d744cdb25a3db0dc6c2b9d3f7))
* Replace Flutter installation with FVM and clarify nvm name. ([19c64c5](https://github.com/duongductrong/os-kit/commit/19c64c5ab7dd5b19056813763e5d40958496b6fb))
* **settings:** add settings page with appearance picker and theme customization ([20585d8](https://github.com/duongductrong/os-kit/commit/20585d80a3064e69cba1ee50f0e52a544bea48ae))
* **sidebar:** remove NavProjects component and update sidebar navigation structure ([53915a6](https://github.com/duongductrong/os-kit/commit/53915a665bd19079f882a274cfb9acc513aaf41c))
* update product name and title to "OS Kit"; add welcome page animation ([6c5bdc8](https://github.com/duongductrong/os-kit/commit/6c5bdc82e6f5dc7c9987f270a1609a123e4cb609))
* update tools to installations file ([deb54f7](https://github.com/duongductrong/os-kit/commit/deb54f78b82678fbd0025e6f150c7f20368f7b26))
