import { Button, Form, FormInstance, Input } from 'antd';
import React, { useCallback } from 'react';

export type GameFormValues = {
  name: string;
  summary?: string | null;
};

export type GameFormProps = {
  initialValue?: GameFormValues | null;
  disabled?: boolean;
  onSubmit?: (data: GameFormValues, form: FormInstance<GameFormValues>) => void;
};

export function GameForm({ initialValue, disabled, onSubmit }: GameFormProps) {
  const [form] = Form.useForm();

  const handleSubmit = useCallback(
    (data: GameFormValues) => {
      if (!onSubmit) {
        return;
      }

      onSubmit(data, form);
    },
    [form, onSubmit]
  );

  return (
    <Form
      form={form}
      initialValues={initialValue ?? undefined}
      disabled={disabled}
      onFinish={handleSubmit}
    >
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: 'Please input the name!' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item label="Summary" name="summary">
        <Input />
      </Form.Item>

      <Button type="primary" htmlType="submit">
        Submit
      </Button>
    </Form>
  );
}
