# EthVM: Dev Kit

A dockerized environment for developing with ease and joyness the EthVM project.

This repository is just composed of two projects and a simple Dockerfile and the following git submodules:

- [EthVM: Frontend](https://github.com/enKryptIO/ethvm)
- [EthVM: Socket Server](https://github.com/enKryptIO/ethvm-socket-server)
- [EthVM: Ethereum](https://github.com/enKryptIO/go-ethereum)

## Cloning

Just issue this command on the terminal:

```sh
$ git clone --recurse-submodules https://github.com/enKryptIO/ethvm-dev-kit
```

## Perequisites

### Setting up properly submodules

Initially, when you issue the git cloning command (shown above), it will pull automatically the submodules on the master branch. Sweet.

The only caveat, or thing you have to keep in mind is that this `docker-compose.yaml` uses mounted volumes to allow having hot code reload in the frontend and the backend. By default, when `git` uses submodules, it creates a `.git` file that points to the parent directory, like this:

```txt
gitdir: ../.git/modules/ethvm-server
```

This file allows you to issue `git` commands inside each submodule as is just a pointer to where the real meat is stored.

As the docker images are built locally and uses `npm` to fetch dependencies, some of them requires the usage of `git`, so having the file will generate problems. So, just before issuing the `docker-compose` commands I recommend you to delete each `.git` file and replace it using a symbolic link, just like this:

```sh
# In parent dir
$ ln -s .git/modules/ethvm-frontend ethvm-frontend/.git
$ ln -s .git/modules/ethvm-server ethvm-server/.git
ln -s .git/modules/ethvm-go-ethereum ethvm-go-ethereum/.git
```

This will solve any initial issue as the symbolic link will act like just a regular `.git` folder and will not cause conflicts building the images. 

### Configuring ethereum difficulty

By default, this project uses a modified version of [`go-ethereum`](https://github.com/enKryptIO/go-ethereum) (where we add all our magic), but as we are developing locally, we prefer to test in our private Ethereum network (this will add the benefit of not having to fully synchronise with `ropsten` neither `mainnet`).

Take a closer look on how is generated the `genesis.json` file in the `docker-compose.yaml`, but in order to allow having insta mining, the best option you can have is to modify directly `go-ethereum` difficulty algorithm to return a fixed difficulty value (so that way the difficulty will not vary at all, and the mining process will be the same). To do so:

```sh
$ vim ethvm-go-ethereum/consensus/ethash/consensus.go
```

Find the method `go-ethereum`:

```go

func CalcDifficulty(config *params.ChainConfig, time uint64, parent *types.Header) *big.Int {
	next := new(big.Int).Add(parent.Number, big1)
	switch {
	case config.IsByzantium(next):
		return calcDifficultyByzantium(time, parent)
	case config.IsHomestead(next):
		return calcDifficultyHomestead(time, parent)
	default:
		return calcDifficultyFrontier(time, parent)
	}
}
```

And replace it to (and choose appropiately the difficulty value):

```go

func CalcDifficulty(config *params.ChainConfig, time uint64, parent *types.Header) *big.Int {
	return big.NewInt(100)
}
```

### Setup a local DNS

Internally, this `docker-compose.yaml` uses the great and the mighty `traefik` as a proxy. By default, all the services are exposed under the domain `.lan`, so I recommend you to have a local DNS service, like `DNSmasq` (instructions for [OSX](https://gist.github.com/ogrrd/5831371) or [Linux](https://wiki.archlinux.org/index.php/dnsmasq)) to resolve custom domains (this is very handy!).

## Developing

Now that you have done sucessfully the prerequisites steps, time to get your hands dirty. Just make sure you have installed `docker` and `docker-compose` (the more recent, the better).

In order to bring up the project you can issue the following command in the terminal:

```sh
$ docker-compose up -d
```

The very first time you fire this command, it will start building the whole docker images (so the boot time will take several minutes).

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
$ docker-compose logs -f # ethvm (you can specify the service name to gather specific logs also)
```

These are just regular `docker-compose` commands, so if you have more questions, the very best you can do is to navigate to the official documentation.

## Contributing

We welcome every kind of contribution, so, please see [CONTRIBUTING](CONTRIBUTING.md) for more details on how to proceed.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

<div align="center">
  <img src="https://forthebadge.com/images/badges/built-with-love.svg" alt="built with love" />
</div>
