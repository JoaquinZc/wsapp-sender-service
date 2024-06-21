deploy:
	docker compose up --build --detach
undeploy:
	docker compose down
stop:
	docker compose stop