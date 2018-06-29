# EthVM: Dev Kit

A dockerized environment for developing with ease and joyness EthVM project.

This repository is just composed of two projects and a simple Dockerfile:

- [EthVM: Frontend](https://github.com/enKryptIO/ethvm)
- [EthVM: Socket Server](https://github.com/enKryptIO/ethvm-socket-server)

## Cloning

Just issue this command on the terminal:

```sh
$ git clone --recurse-submodules https://github.com/enKryptIO/ethvm-dev-kit
```

## Developing

Make sure you have installed `docker` and `docker-compose`.

In order to bring up the project you can issue the following command in the terminal (these are regular `docker-compose` commands, nothing fancy):

```sh
$ docker-compose up -d
```

To stop:

```sh
$ docker-compose stop
```

To delete built docker images:

```sh
$ docker-compose rm
```

And to check the logs:

```sh
$ docker-compose logs -f
```

Make sure you have already setup a local DNS (like DNSmasq) to resolve custom domain .lan

## Contributing

Please see [CONTRIBUTING](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

<div align="center">
  <img src="https://forthebadge.com/images/badges/built-with-love.svg" alt="built with love" />
</div>
