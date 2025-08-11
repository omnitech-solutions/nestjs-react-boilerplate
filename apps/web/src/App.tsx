import React, { useEffect, useState } from 'react'
import { Layout, Typography, Card, Row, Col, Tag } from 'antd'
import { api } from './api'

const { Header, Content } = Layout
const { Title, Paragraph } = Typography

export default function App() {
  const [health, setHealth] = useState<any>(null)
  useEffect(() => {
    api
      .get('/api/health')
      .then(r => setHealth(r.data))
      .catch(() => setHealth({ ok: false }))
  }, [])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff' }}>
        <Title level={3} style={{ margin: 0 }}>
          Organizational Health Dashboard
        </Title>
      </Header>
      <Content style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card title='API Health'>
              <Paragraph>
                Status: {health ? health.ok ? <Tag color='green'>OK</Tag> : <Tag color='red'>Down</Tag> : '...'}
              </Paragraph>
            </Card>
          </Col>
          <Col span={8}>
            <Card title='Org Health Score'>
              <Paragraph>Coming soon…</Paragraph>
            </Card>
          </Col>
          <Col span={8}>
            <Card title='Insights'>
              <Paragraph>Coming soon…</Paragraph>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  )
}
