import { Button, Form, Input } from 'antd';
import React from 'react';

export function GameForm() {
  const onFinish = (values: any) => {
    console.log('Success:', values);
  };

  return (
    <Form onFinish={onFinish} initialValues={{ name: 'ok' }}>
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: 'Please input your username!' }]}
      >
        <Input />
      </Form.Item>

      <Button type="primary" htmlType="submit">
        Submit
      </Button>
    </Form>
  );
}
