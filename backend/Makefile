.PHONY: run seed build test clean

run:
	go run cmd/api/main.go

seed:
	go run cmd/seeder/main.go

build:
	go build -o bin/server cmd/api/main.go

test:
	go test -v ./...

clean:
	rm -rf bin/
