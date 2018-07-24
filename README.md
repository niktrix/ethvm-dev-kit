<div align="center">
  <h1>
    <img src="https://raw.githubusercontent.com/enKryptIO/ethvm-dev-kit/master/assets/logo.png" alt="ethvm-logo">
  </h1>
</div>

# EthVM: Development Kit

A dockerized environment for developing with ease and joyness the EthVM project.

This repository is just composed of three projects and a simple Dockerfile and the following `git submodules`:

- [EthVM: Frontend](https://github.com/enKryptIO/ethvm)
- [EthVM: Socket Server](https://github.com/enKryptIO/ethvm-socket-server)
- [EthVM: Ethereum](https://github.com/enKryptIO/go-ethereum)

## Cloning

Just issue this command on the terminal:

```sh
$ git clone --recurse-submodules https://github.com/enKryptIO/ethvm-dev-kit
```

When everyhing is done, just make sure that each of the submodules are on the `master` branch (or the one you prefer to work on).

## Perequisites

### Setting up properly submodules

Initially, when you issue the git cloning command, it will pull automatically all the submodules on the master branch. Sweet.

The only caveat is that this `docker-compose.yaml` uses mounted volumes to allow having hot code reload benefits in the frontend and the backend. By default, when `git` uses submodules, it creates a `.git` file that points to the parent directory, like this:

```txt
gitdir: ../.git/modules/ethvm-server
```

This file allows you to issue `git` commands inside each submodule like a regular `git` repository. In our case, Docker images are built locally and uses `yarn` to fetch dependencies (like a regular NodeJs app), but with the exception that some of them requires the usage of `git` (i.e, [husky](https://github.com/husky/husky) uses it to register commit hooks), so having the pointer file as above, will confuse those packages as they expect a regular `.git` directory. 

So, as a summary, just before issuing the very first `docker-compose` command, we recommend you to delete each `.git` submodule file and replace it using a symbolic link that will point to the directory, just like this:

```sh
# In parent dev-kit dir

# Delete
$ rm client/.git server/.git

# Link server
$ cd server
$ ln -s ../.git/modules/ethvm-server .git

# Go to parent
$ cd ..

# Link client
$ cd client
$ ln -s ../.git/modules/ethvm-frontend .git
```

### Windows 10

Windows 10 is becoming a very sexy operating system to develop, even with classical *nix applications. 

Although, there are some caveats we need to take care of, at the point while we were testing, we found the following issues:

* **go-ethereum**: Docker doesn't build properly the image [(reason here)](https://github.com/ethereum/go-ethereum/issues/16828). To solve it, for now, is to use the uploaded version on Docker Hub (so point to the following image: `enkryptio/go-ethereum:latest`)
* **traefik**: The image uses a shared mounted volume, depending on the installed version you have of docker, it may not init properly. [In this thread here's the solution](https://github.com/docker/for-win/issues/1829) (basically, if you use PowerShell, set the environment variable `$Env:COMPOSE_CONVERT_WINDOWS_PATHS=1`).

### Setup a local DNS (or edit hosts file)

Internally, this `docker-compose.yaml` uses the great and the mighty [`traefik`](https://traefik.io/) as a frontend proxy. By default, all of the services are exposed under the local domain `.lan`.

So, we recommend you to have a local DNS service like `DNSmasq` (instructions for [OSX](https://gist.github.com/ogrrd/5831371), [Linux](https://wiki.archlinux.org/index.php/dnsmasq) or [Windows](http://www.orbitale.io/2017/12/05/setup-a-dnsmasq-equivalent-on-windows-with-acrylic.html)) to resolve custom domains and to have access directly to the services with the specified domain (alternatively, you can open ports just like a regular `docker-compose` and access those with `localhost`).

Or you can take the classical approach to edit and add these entries in `/etc/hosts` file, just like this:

```sh
127.0.0.1       geth.ethvm.lan
127.0.0.1       rethink.ethvm.lan
127.0.0.1       rethink.dashboard.ethvm.lan
127.0.0.1       ws.ethvm.lan
127.0.0.1       redis.ethvm.lan
127.0.0.1       ethvm.lan
```

## Developing

Now that you have done sucessfully the prerequisites steps (yay!), it's time to get your hands dirty. Just make sure you have installed `docker` and `docker-compose` (the more recent, the better).

In order to bring up the project you can issue the following command in the terminal:

```sh
$ docker-compose up -d
```

The very first time you fire this command, it will start building the whole docker images (so the boot time will take several minutes and CPU will start doing heavy work!).

To stop:

```sh
$ docker-compose stop
```

To delete built docker images:

```sh
$ docker-compose rm -s
```

And to check the logs:

```sh
$ docker-compose logs -f # ethvm (you can specify the service name to gather specific logs also)
```

These are just regular `docker-compose` commands, so if you have more questions related to this, the very best you can do is to navigate to the [official documentation](https://docs.docker.com/compose/).

## Contributing

We welcome every kind of contribution, so, please see [CONTRIBUTING](.github/CONTRIBUTING.md) for more details on how to proceed.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

<div align="center">
  <img src="https://forthebadge.com/images/badges/built-with-love.svg" alt="built with love by enKryptIO team" />
</div>
