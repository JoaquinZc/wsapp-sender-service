build:
	docker compose up --build --detach
deploy:
	docker compose up --detach
undeploy:
	docker compose down
stop:
	docker compose stop