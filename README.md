# OS-Status

![Feature Mockup](https://tommy141x.github.io/os-status-page/hero-image-light.jpeg)

This project uses BunJS, Astro, React, Tailwind, and ShadcnUI.

[Live Demo](https://status.timmygstudios.com/)

## Installation and Setup

### Using the Setup Script (Recommended)
The setup script includes an update checker and provides functionality for installing, upgrading, starting, stopping, and viewing the application's logs.
1. **Download the Latest Stable Release:**
    ```bash
    curl -O https://raw.githubusercontent.com/tommy141x/os-status-page/main/scripts/setup.sh && chmod +x setup.sh && ./setup.sh
    ```

2. **Configure Your Settings:**
   - Rename `config.example.yml` to `config.yml`.
   - Change the `secret` to a secure value for storing session cookies.
   - Edit other configuration settings via the web UI.

3. **Access the Status Page:**
   - Default port is `3000`.
   - For Docker users, check `docker-compose.yml` for port configuration.

### Using BunJS (Without the Setup Script)

1. **Install BunJS:**
   - **Linux & Mac:** 
     ```bash
     curl -fsSL https://bun.sh/install | bash
     ```
   - **Windows:** 
     ```powershell
     powershell -c "irm bun.sh/install.ps1 | iex"
     ```
     
2. **Clone the Repository:**
    ```bash
    git clone https://github.com/tommy141x/os-status-page.git
    ```

    **Note:** Make sure to `cd` into the cloned repository directory:
    ```bash
    cd os-status-page
    ```

3. **Install Dependencies:**
    ```bash
    bun install
    ```

4. **Configure Your Settings:**
   - Rename `config.example.yml` to `config.yml`.
   - Change the `secret` to a secure value for storing session cookies.
   - Edit other configuration settings via the web UI.

5. **Start the Application:**
   - Run:
     ```bash
     bun start
     ```
   - Alternatively, if using Docker:
     ```bash
     docker compose up
     ```
   - Access the status page at port `3000` by default or the port specified in `docker-compose.yml`.


## Features

- **Service Monitoring:** Checks response codes of URLs at configurable intervals with a configurable data retention time/history.
- **Charts:** Response times are recorded and displayed on charts.
- **Incident Management:** Supports incidents of type 'incident' or 'maintenance' with a description and a list of affected services.
- **User Roles:** Admins have full access to the settings, while Managers can only manage incidents.
- **Dark/Light Mode:** The status page supports both dark and light modes.

![Demo Picture](https://tommy141x.github.io/os-status-page/hero-image-dark.jpeg)

## Motivation

I created this project because I couldn't find a lightweight status page that was super simple and easy to set up. Additionally, I wanted to try out BunJS and React, as I've never made a full React project before, and I've never used Tailwind.

## Contributing

Contributions to this project are encouraged and appreciated. Please feel free to submit pull requests or open issues if you encounter any problems or have suggestions for improvements.

![Alt](https://repobeats.axiom.co/api/embed/19f88f4c6a981fc2d81415907ca79424988ffe87.svg "Repobeats analytics image")

## License

This project is open source and available under the [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/deed.en).
