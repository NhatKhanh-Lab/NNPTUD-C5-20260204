# Message API Guide

Base URL:

```text
http://localhost:3000/api/v1/messages
```

Yeu cau dang nhap:

- Dang nhap bang `POST /api/v1/auth/login`
- Gui token theo header:

```text
Authorization: Bearer <token>
```

## 1. Lay toan bo tin nhan giua user hien tai va 1 user

```http
GET /api/v1/messages/:userID
```

Vi du:

```http
GET http://localhost:3000/api/v1/messages/67e3c4d2b19d6c6f7f2d1111
Authorization: Bearer <token>
```

## 2. Gui tin nhan

```http
POST /api/v1/messages
Content-Type: application/json
```

Neu gui text:

```json
{
  "to": "67e3c4d2b19d6c6f7f2d1111",
  "type": "text",
  "text": "Xin chao"
}
```

Neu gui file:

```json
{
  "to": "67e3c4d2b19d6c6f7f2d1111",
  "type": "file",
  "text": "uploads/1774513816999-582557723.xlsx"
}
```

Co the gui dang long nhau:

```json
{
  "to": "67e3c4d2b19d6c6f7f2d1111",
  "messageContent": {
    "type": "text",
    "text": "Xin chao"
  }
}
```

## 3. Lay message cuoi cung cua moi cuoc tro chuyen

```http
GET /api/v1/messages
```

Vi du:

```http
GET http://localhost:3000/api/v1/messages
Authorization: Bearer <token>
```
