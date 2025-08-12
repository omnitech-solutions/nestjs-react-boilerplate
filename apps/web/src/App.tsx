import React, { useEffect, useState } from 'react'
import { Layout, Typography, Card, Row, Col, Tag, List } from 'antd'
import { api } from './api'

const { Header, Content } = Layout
const { Title, Paragraph } = Typography

export default function App() {
  const [health, setHealth] = useState<any>(null)
  const [metrics, setMetrics] = useState<any[]>([])

  useEffect(() => {
    api
      .get('/api/health')
      .then(r => setHealth(r.data))
      .catch(() => setHealth({ ok: false }))

    api
      .get('/api/metrics')
      .then(r => setMetrics(r.data))
      .catch(() => setMetrics([]))
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
            <Card title='Metrics'>
              {metrics.length > 0 ? (
                <List
                  size='small'
                  dataSource={metrics}
                  renderItem={m => (
                    <List.Item>
                      <strong>{m.name}:</strong> {m.value}
                      {m.unit ? ` ${m.unit}` : ''}
                    </List.Item>
                  )}
                />
              ) : (
                <Paragraph>No metrics available</Paragraph>
              )}
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
